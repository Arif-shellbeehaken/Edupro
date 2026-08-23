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

  try {
    await financeRepository.recordPayment({
      tenantId: session.user.tenantId,
      invoiceId: parsed.data.invoiceId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      transactionId: parsed.data.transactionId,
      notes: parsed.data.notes,
      receivedById: session.user.id,
    });

    revalidatePath("/tenant/admin/finance");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "পেমেন্ট রেকর্ড করা যায়নি" };
  }
}
