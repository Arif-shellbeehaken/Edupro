"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";

const schema = z.object({
  studentId: z.string().min(1),
  totalAmount: z.coerce.number().int().positive("পরিমাণ দিন"),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
  discountAmount: z.coerce.number().int().min(0).optional(),
});

export type CreateInvoiceState = {
  error?: string;
  success?: boolean;
  invoiceNumber?: string;
};

export async function createInvoiceAction(
  _prev: CreateInvoiceState,
  formData: FormData
): Promise<CreateInvoiceState> {
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
    studentId: formData.get("studentId"),
    totalAmount: formData.get("totalAmount"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") || undefined,
    discountAmount: formData.get("discountAmount") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  try {
    const invoice = await financeRepository.createInvoice({
      tenantId: session.user.tenantId,
      studentId: parsed.data.studentId,
      totalAmount: parsed.data.totalAmount,
      dueDate: new Date(parsed.data.dueDate),
      notes: parsed.data.notes,
      discountAmount: parsed.data.discountAmount,
    });

    revalidatePath("/tenant/admin/finance");
    return { success: true, invoiceNumber: invoice.invoiceNumber };
  } catch (e) {
    console.error(e);
    return { error: "চালান তৈরি করা যায়নি" };
  }
}
