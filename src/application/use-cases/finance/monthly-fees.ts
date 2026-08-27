"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";

export type MonthlyFeeState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** Generate monthly fee invoices for all active students (or one class) + SMS */
export async function generateMonthlyFeesAction(
  _prev: MonthlyFeeState,
  formData: FormData
): Promise<MonthlyFeeState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const amount = Number(formData.get("amount") || 0);
  const classId = String(formData.get("classId") || "") || undefined;
  const month = Number(formData.get("month") || new Date().getMonth() + 1);
  const year = Number(formData.get("year") || new Date().getFullYear());
  const notify = formData.get("notify") !== "off";
  const dueDay = Math.min(28, Math.max(1, Number(formData.get("dueDay") || 10)));

  if (amount <= 0) return { error: "মাসিক ফি পরিমাণ দিন" };

  try {
    const dueDate = new Date(year, month - 1, dueDay);
    const students = await prisma.student.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        ...(classId ? { currentClassId: classId } : {}),
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
      },
      take: 800,
    });

    if (students.length === 0) return { error: "সক্রিয় শিক্ষার্থী নেই" };

    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    let created = 0;
    let sent = 0;
    for (const st of students) {
      const invoice = await financeRepository.createInvoice({
        tenantId: session.user.tenantId,
        studentId: st.id,
        totalAmount: amount,
        dueDate,
        notes: `মাসিক ফি ${month}/${year}`,
        discountAmount: 0,
      });
      created += 1;

      if (notify) {
        const phone = st.guardianPhone || st.fatherPhone;
        if (phone) {
          const body = `মাসিক ফি ${month}/${year}: ${st.nameBn || st.name} (${st.studentId}) — ৳${amount.toLocaleString("en-BD")}, চালান ${invoice.invoiceNumber}, ডিউ ${dueDate.toLocaleDateString("en-GB")}। — Edupro`;
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Monthly fee",
              body,
              relatedType: "FEE_MONTHLY",
              relatedId: invoice.id,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
      }
    }

    revalidatePath("/tenant/admin/finance");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `${created} মাসিক চালান · SMS ${sent}`,
    };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "মাসিক ফি ব্যর্থ" };
  }
}
