"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";

export type NotifyChronicState = {
  error?: string;
  success?: boolean;
  sent?: number;
  message?: string;
};

export async function notifyChronicAbsenteesAction(
  _prev: NotifyChronicState,
  formData: FormData
): Promise<NotifyChronicState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const fromStr = String(formData.get("from") || "");
  const toStr = String(formData.get("to") || "");
  const threshold = Number(formData.get("threshold") || 20);
  const classId = String(formData.get("classId") || "") || undefined;
  const customBody = String(formData.get("body") || "").trim();

  if (!fromStr || !toStr) return { error: "তারিখ দিন" };

  try {
    const report = await attendanceRepository.chronicAbsentees({
      from: new Date(fromStr),
      to: new Date(toStr),
      thresholdPct: threshold,
      classId,
    });

    if (report.rows.length === 0) {
      return { error: "ফ্ল্যাগড শিক্ষার্থী নেই — SMS পাঠানোর কিছু নেই" };
    }

    let sent = 0;
    for (const r of report.rows) {
      if (!r.phone) continue;
      const body =
        customBody ||
        `অনুপস্থিতি সতর্কতা: ${r.name} (${r.studentId}) গত ${report.spanDays} দিনে ${r.absentDays} দিন অনুপস্থিত (${r.pct}%)। অনুগ্রহ করে যোগাযোগ করুন। — Edupro`;

      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: r.phone,
          subject: "Chronic absence alert",
          body,
          relatedType: "CHRONIC_ABSENCE",
          relatedId: r.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/reports/absenteeism");
    revalidatePath("/tenant/admin/communication");

    return {
      success: true,
      sent,
      message: `${sent}/${report.rows.length} জন অভিভাবককে সতর্কতা SMS পাঠানো হয়েছে`,
    };
  } catch (e) {
    console.error(e);
    return { error: "SMS পাঠানো ব্যর্থ" };
  }
}
