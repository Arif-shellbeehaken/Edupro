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
      const pct = Number(r.pct) || 0;
      let grade = "F";
      if (pct >= 80) grade = "A+";
      else if (pct >= 70) grade = "A";
      else if (pct >= 60) grade = "A-";
      else if (pct >= 50) grade = "B";
      else if (pct >= 40) grade = "C";
      else if (pct >= 33) grade = "D";

      // Template remarks (AI-style personalized teacher comments)
      let remark = "আরও চেষ্টা অব্যাহত রাখুন।";
      if (pct >= 80)
        remark = "অসাধারণ ফলাফল! এই মান ধরে রাখুন।";
      else if (pct >= 70)
        remark = "খুব ভালো — আরও একটু মনোযোগে শীর্ষে যেতে পারবেন।";
      else if (pct >= 60)
        remark = "ভালো চেষ্টা; দুর্বল বিষয়ে অতিরিক্ত অনুশীলন করুন।";
      else if (pct >= 50)
        remark = "উন্নতির সুযোগ আছে — নিয়মিত পড়াশোনা বাড়ান।";
      else if (pct >= 33)
        remark = "পাস হয়েছে; শিক্ষক/অভিভাবকের সাথে পরামর্শ নিন।";
      else
        remark = "পুনরায় প্রস্তুতি জরুরি — টিউটোরিয়াল সাপোর্ট নিন।";

      const includeRemark = formData.get("includeRemark") !== "off";
      const body =
        customBody ||
        `ফলাফল প্রকাশ: ${r.name} (${r.code}) — ${examName}: ${r.obtained}/${r.full} (${pct}%, গ্রেড ${grade}), বিষয় ${r.subjects}টি।${includeRemark ? " মন্তব্য: " + remark : ""} — Edupro`;

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
      message: `ফলাফল প্রকাশ · SMS ${sent}/${results.length} (গ্রেডসহ)`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ফলাফল SMS ব্যর্থ" };
  }
}
