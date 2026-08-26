"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type NotifyResultsState = {
  error?: string;
  success?: boolean;
  sent?: number;
  message?: string;
};

export async function notifyExamResultsAction(
  _prev: NotifyResultsState,
  formData: FormData
): Promise<NotifyResultsState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const examId = String(formData.get("examId") || "");
  const customBody = String(formData.get("body") || "").trim();
  if (!examId) return { error: "পরীক্ষা বাছুন" };

  try {
    const exam = await prisma.exam.findFirst({
      where: { id: examId, tenantId: session.user.tenantId },
    });
    if (!exam) return { error: "পরীক্ষা পাওয়া যায়নি" };

    const results = await examRepository.studentResultsSummary(examId);
    if (results.length === 0) {
      return { error: "এই পরীক্ষায় কোনো নম্বর নেই" };
    }

    const examName = exam.nameBn || exam.name;
    let sent = 0;

    for (const r of results) {
      if (!r.phone) continue;
      const body =
        customBody ||
        `ফলাফল: ${r.name} (${r.code}) — ${examName}: ${r.obtained}/${r.full} (${r.pct}%), বিষয় ${r.subjects}টি। বিস্তারিত মার্কশিট পোর্টালে দেখুন। — Edupro`;

      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: r.phone,
          subject: `Result: ${examName}`,
          body,
          relatedType: "EXAM_RESULT",
          relatedId: examId,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/exams");
    revalidatePath("/tenant/admin/exams/notify");
    revalidatePath("/tenant/admin/communication");

    return {
      success: true,
      sent,
      message: `${sent}/${results.length} জন অভিভাবককে ফলাফল SMS পাঠানো হয়েছে`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ফলাফল SMS ব্যর্থ" };
  }
}
