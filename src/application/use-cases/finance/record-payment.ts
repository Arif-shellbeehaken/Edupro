"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";

const schema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().int().positive("পরিমাণ দিন"),
  method: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "BANK", "CARD", "OTHER"]),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordPaymentState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function recordPaymentAction(
  _prev: RecordPaymentState,
  formData: FormData
): Promise<RecordPaymentState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) {
    return { error: "অনুমতি নেই" };
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = schema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    transactionId: formData.get("transactionId") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  const notifyGuardian = formData.get("notifyGuardian") !== "off";

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parsed.data.invoiceId,
        tenantId: session.user.tenantId,
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
    });

    await financeRepository.recordPayment({
      tenantId: session.user.tenantId,
      invoiceId: parsed.data.invoiceId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      transactionId: parsed.data.transactionId,
      notes: parsed.data.notes,
      receivedById: session.user.id,
    });

    let smsNote = "";
    if (notifyGuardian && invoice?.student) {
      const phone =
        invoice.student.guardianPhone || invoice.student.fatherPhone;
      if (phone) {
        try {
          const { communicationRepository } = await import(
            "@/infrastructure/database/repositories/communication-repository"
          );
          const remaining = Math.max(
            0,
            invoice.totalAmount -
              invoice.discountAmount -
              invoice.paidAmount -
              parsed.data.amount
          );
          const body = `ফি রসিদ: ${invoice.student.nameBn || invoice.student.name} (${invoice.student.studentId}) — চালান ${invoice.invoiceNumber}, পেমেন্ট ৳${parsed.data.amount.toLocaleString("en-BD")} (${parsed.data.method})${remaining > 0 ? ", বাকি ৳" + remaining.toLocaleString("en-BD") : " · পরিশোধিত"}। — Edupro`;
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Fee receipt",
            body,
            relatedType: "FEE_PAYMENT",
            relatedId: invoice.id,
          });
          smsNote = " · SMS রসিদ";
        } catch (smsErr) {
          console.error("payment SMS", smsErr);
        }
      }
    }

    revalidatePath("/tenant/admin/finance");
    revalidatePath("/tenant/admin/ledger");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `পেমেন্ট সংরক্ষিত${smsNote}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "পেমেন্ট রেকর্ড করা যায়নি" };
  }
}
