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

  try {
    const result = await hrRepository.processPayroll({
      tenantId: session.user.tenantId,
      month: parsed.data.month,
      year: parsed.data.year,
      notes: parsed.data.notes,
    });
    revalidatePath("/tenant/admin/hr/payroll");
    revalidatePath("/tenant/admin/hr");
    return {
      success: true,
      message: `${result.payments.length} জনের স্যালারি প্রসেস হয়েছে`,
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
    if (markAll && payrollRunId) {
      await hrRepository.markAllSalariesPaid(payrollRunId, session.user.tenantId);
    } else if (paymentId) {
      await hrRepository.markSalaryPaid({
        paymentId,
        tenantId: session.user.tenantId,
        paymentMethod,
        transactionId,
      });
    } else {
      return { error: "পেমেন্ট আইডি দরকার" };
    }
    revalidatePath("/tenant/admin/hr/payroll");
    return { success: true, message: "পেমেন্ট আপডেট হয়েছে" };
  } catch (e) {
    console.error(e);
    return { error: "পেমেন্ট মার্ক ব্যর্থ" };
  }
}
