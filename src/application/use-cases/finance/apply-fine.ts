"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type FineState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** Apply flat or percent fine on overdue invoices + SMS guardians */
export async function applyOverdueFineAction(
  _prev: FineState,
  formData: FormData
): Promise<FineState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const fineFlat = Number(formData.get("fineFlat") || 0);
  const finePct = Number(formData.get("finePct") || 0);
  const notify = formData.get("notify") !== "off";
  if (fineFlat <= 0 && finePct <= 0) {
    return { error: "ফিক্সড ৳ বা % দিন" };
  }

  try {
    const now = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        dueDate: { lt: now },
      },
      include: {
        student: {
          select: {
            name: true,
            nameBn: true,
            studentId: true,
            fatherPhone: true,
            guardianPhone: true,
          },
        },
      },
      take: 300,
    });

    if (invoices.length === 0) return { error: "ওভারডিউ চালান নেই" };

    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    let updated = 0;
    let sent = 0;
    for (const inv of invoices) {
      const outstanding = Math.max(
        0,
        inv.totalAmount - inv.discountAmount - inv.paidAmount
      );
      if (outstanding <= 0) continue;
      const addFine =
        fineFlat > 0
          ? fineFlat
          : Math.round((outstanding * finePct) / 100);
      if (addFine <= 0) continue;

      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          fineAmount: inv.fineAmount + addFine,
          totalAmount: inv.totalAmount + addFine,
          status: "OVERDUE",
        },
      });
      updated += 1;

      if (notify && inv.student) {
        const phone = inv.student.guardianPhone || inv.student.fatherPhone;
        if (phone) {
          const body = `ফি জরিমানা: ${inv.student.nameBn || inv.student.name} (${inv.student.studentId}) — চালান ${inv.invoiceNumber} এ ৳${addFine.toLocaleString("en-BD")} জরিমানা যোগ (বকেয়া)। মোট বাকি ৳${(outstanding + addFine).toLocaleString("en-BD")}। — Edupro`;
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Fee fine",
              body,
              relatedType: "FEE_FINE",
              relatedId: inv.id,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
      }
    }

    revalidatePath("/tenant/admin/finance");
    revalidatePath("/tenant/admin/finance/reminders");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `${updated} চালানে জরিমানা · SMS ${sent}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "জরিমানা প্রয়োগ ব্যর্থ" };
  }
}
