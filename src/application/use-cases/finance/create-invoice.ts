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
  message?: string;
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

  const notify = formData.get("notify") !== "off";

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const student = await prisma.student.findFirst({
      where: {
        id: parsed.data.studentId,
        tenantId: session.user.tenantId,
      },
      select: {
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
      },
    });

    const invoice = await financeRepository.createInvoice({
      tenantId: session.user.tenantId,
      studentId: parsed.data.studentId,
      totalAmount: parsed.data.totalAmount,
      dueDate: new Date(parsed.data.dueDate),
      notes: parsed.data.notes,
      discountAmount: parsed.data.discountAmount,
    });

    let smsNote = "";
    if (notify && student) {
      const phone = student.guardianPhone || student.fatherPhone;
      if (phone) {
        try {
          const { communicationRepository } = await import(
            "@/infrastructure/database/repositories/communication-repository"
          );
          const due = new Date(parsed.data.dueDate).toLocaleDateString("en-GB");
          const net =
            parsed.data.totalAmount - (parsed.data.discountAmount || 0);
          const body = `ফি চালান: ${student.nameBn || student.name} (${student.studentId}) — নং ${invoice.invoiceNumber}, ৳${net.toLocaleString("en-BD")}, ডিউ ${due}${parsed.data.notes ? ". " + parsed.data.notes.slice(0, 40) : ""}। — Edupro`;
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Fee invoice",
            body,
            relatedType: "FEE_INVOICE",
            relatedId: invoice.id,
          });
          smsNote = " · SMS";
        } catch (smsErr) {
          console.error("invoice SMS", smsErr);
        }
      }
    }

    revalidatePath("/tenant/admin/finance");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      message: `চালান ${invoice.invoiceNumber}${smsNote}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "চালান তৈরি করা যায়নি" };
  }
}
