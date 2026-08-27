"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";

export type PayrollState = { error?: string; success?: boolean; message?: string };

const processSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  notes: z.string().optional(),
});

export async function processPayrollAction(
  _prev: PayrollState,
  formData: FormData
): Promise<PayrollState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = processSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  const notifyStaff = formData.get("notifyStaff") === "on";

  try {
    const result = await hrRepository.processPayroll({
      tenantId: session.user.tenantId,
      month: parsed.data.month,
      year: parsed.data.year,
      notes: parsed.data.notes,
    });

    let smsNote = "";
    if (notifyStaff && result.payments.length > 0) {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const staffIds = result.payments.map(
          (p: { staffId: string }) => p.staffId
        );
        const staffList = await prisma.staff.findMany({
          where: { id: { in: staffIds }, tenantId: session.user.tenantId },
          select: {
            id: true,
            name: true,
            nameBn: true,
            employeeId: true,
            phone: true,
          },
        });
        const byId = new Map(staffList.map((s) => [s.id, s]));
        let sent = 0;
        for (const pay of result.payments as {
          staffId: string;
          netSalary: number;
        }[]) {
          const st = byId.get(pay.staffId);
          if (!st?.phone) continue;
          const body = `পে-রোল তৈরি: ${st.nameBn || st.name} (${st.employeeId}) — ${parsed.data.month}/${parsed.data.year}, নেট ৳${pay.netSalary.toLocaleString("en-BD")} (পেন্ডিং)। — Edupro`;
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: st.phone,
              subject: "Payroll processed",
              body,
              relatedType: "PAYROLL_PROCESS",
              relatedId: pay.staffId,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
        smsNote = ` · SMS ${sent}`;
      } catch (smsErr) {
        console.error("payroll process SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/hr/payroll");
    revalidatePath("/tenant/admin/hr");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `${result.payments.length} জনের স্যালারি প্রসেস হয়েছে${smsNote}`,
    };
  } catch (e: unknown) {
    console.error(e);
    return {
      error: e instanceof Error ? e.message : "পে-রোল প্রসেস ব্যর্থ",
    };
  }
}

export async function markSalaryPaidAction(
  _prev: PayrollState,
  formData: FormData
): Promise<PayrollState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const paymentId = formData.get("paymentId") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "BANK";
  const transactionId = (formData.get("transactionId") as string) || undefined;
  const markAll = formData.get("markAll") === "true";
  const payrollRunId = formData.get("payrollRunId") as string;

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    let targets: {
      id: string;
      netSalary: number;
      staff: {
        id: string;
        name: string;
        nameBn: string | null;
        employeeId: string;
        phone: string | null;
      };
      run: { month: number; year: number };
    }[] = [];

    if (markAll && payrollRunId) {
      const pending = await prisma.salaryPayment.findMany({
        where: {
          payrollRunId,
          tenantId: session.user.tenantId,
          status: "PENDING",
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              nameBn: true,
              employeeId: true,
              phone: true,
            },
          },
          payrollRun: { select: { month: true, year: true } },
        },
      });
      await hrRepository.markAllSalariesPaid(
        payrollRunId,
        session.user.tenantId
      );
      targets = pending.map((p) => ({
        id: p.id,
        netSalary: p.netSalary,
        staff: p.staff,
        run: p.payrollRun,
      }));
    } else if (paymentId) {
      const one = await prisma.salaryPayment.findFirst({
        where: { id: paymentId, tenantId: session.user.tenantId },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              nameBn: true,
              employeeId: true,
              phone: true,
            },
          },
          payrollRun: { select: { month: true, year: true } },
        },
      });
      await hrRepository.markSalaryPaid({
        paymentId,
        tenantId: session.user.tenantId,
        paymentMethod,
        transactionId,
      });
      if (one) {
        targets = [
          {
            id: one.id,
            netSalary: one.netSalary,
            staff: one.staff,
            run: one.payrollRun,
          },
        ];
      }
    } else {
      return { error: "পেমেন্ট আইডি দরকার" };
    }

    let smsSent = 0;
    for (const t of targets) {
      if (!t.staff.phone) continue;
      const body = `স্যালারি প্রদান: ${t.staff.nameBn || t.staff.name} (${t.staff.employeeId}) — ${t.run.month}/${t.run.year} নেট ৳${t.netSalary.toLocaleString("en-BD")}। — Edupro`;
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: t.staff.phone,
          subject: "Salary paid",
          body,
          relatedType: "PAYROLL",
          relatedId: t.id,
        });
        smsSent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/hr/payroll");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `পেমেন্ট আপডেট · SMS ${smsSent}/${targets.length}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "পেমেন্ট মার্ক ব্যর্থ" };
  }
}
