"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type NpsState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** Send NPS / parent satisfaction survey SMS (score 0-10) invite */
export async function sendParentNpsSurveyAction(
  _prev: NpsState,
  formData: FormData
): Promise<NpsState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const title =
    String(formData.get("title") || "").trim() ||
    "অভিভাবক সন্তুষ্টি জরিপ (NPS)";
  const note = String(formData.get("note") || "").trim();

  try {
    let surveyId: string | undefined;
    try {
      const survey = await prisma.survey.create({
        data: {
          tenantId: session.user.tenantId,
          title,
          description:
            note ||
            "০-১০ স্কেলে রেট করুন। উত্তর: অফিসে বা পোর্টালে জমা দিন।",
          audience: "PARENTS",
          status: "OPEN",
        },
      });
      surveyId = survey.id;
    } catch {
      /* optional */
    }

    const students = await prisma.student.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "OPEN",
      },
      select: { guardianPhone: true, fatherPhone: true },
      take: 500,
    });
    const phones = new Set<string>();
    for (const st of students) {
      const ph = st.guardianPhone || st.fatherPhone;
      if (ph) phones.add(ph);
    }

    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    const body = `NPS জরিপ: ${title} — আমাদের সেবা ০-১০ এ রেট করবেন?${note ? " " + note.slice(0, 80) : ""} উত্তর অফিস/পোর্টালে। — Edupro`;
    let sent = 0;
    for (const phone of phones) {
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: title,
          body: body.slice(0, 320),
          relatedType: "SURVEY_NPS",
          relatedId: surveyId || session.user.tenantId,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/surveys");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `NPS SMS ${sent}` };
  } catch (e) {
    console.error(e);
    return { error: "NPS সার্ভে SMS ব্যর্থ" };
  }
}
