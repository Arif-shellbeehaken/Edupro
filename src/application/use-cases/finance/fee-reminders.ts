"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";

export type FeeReminderState = {
  error?: string;
  success?: boolean;
  sent?: number;
  message?: string;
};

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export async function sendFeeRemindersAction(
  _prev: FeeReminderState,
  formData: FormData
): Promise<FeeReminderState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const daysAhead = Number(formData.get("daysAhead") || 0);
  const customBody = String(formData.get("body") || "").trim();

  try {
    const list = await financeRepository.listOverdueForReminder({
      daysAhead,
      take: 200,
    });

    if (list.length === 0) {
      return { error: "রিমাইন্ডারের জন্য কোনো বকেয়া চালান নেই" };
    }

    // One SMS per student (aggregate balances if multiple invoices)
    const byStudent = new Map<
      string,
      {
        phone: string;
        name: string;
        studentCode: string;
        total: number;
        invoices: string[];
      }
    >();

    for (const inv of list) {
      const phone =
        inv.student.guardianPhone || inv.student.fatherPhone || "";
      if (!phone) continue;
      const key = inv.student.id;
      const existing = byStudent.get(key);
      if (existing) {
        existing.total += inv.balance;
        existing.invoices.push(inv.invoiceNumber);
      } else {
        byStudent.set(key, {
          phone,
          name: inv.student.nameBn || inv.student.name,
          studentCode: inv.student.studentId,
          total: inv.balance,
          invoices: [inv.invoiceNumber],
        });
      }
    }

    let sent = 0;
    for (const [studentId, row] of byStudent) {
      const body =
        customBody ||
        `ফি রিমাইন্ডার: ${row.name} (${row.studentCode}) এর বকেয়া ${bdt(row.total)}। চালান: ${row.invoices.slice(0, 3).join(", ")}${row.invoices.length > 3 ? "…" : ""}। অনুগ্রহ করে পরিশোধ করুন। — Edupro`;

      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: row.phone,
          subject: "Fee reminder",
          body,
          relatedType: "FEE_REMINDER",
          relatedId: studentId,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/finance");
    revalidatePath("/tenant/admin/finance/reminders");
    revalidatePath("/tenant/admin/communication");

    return {
      success: true,
      sent,
      message: `${sent} জন অভিভাবককে ফি রিমাইন্ডার পাঠানো হয়েছে (${list.length} চালান)`,
    };
  } catch (e) {
    console.error(e);
    return { error: "রিমাইন্ডার পাঠানো ব্যর্থ" };
  }
}
