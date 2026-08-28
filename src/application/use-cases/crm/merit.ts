"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type MeritState = { error?: string; success?: boolean; message?: string };

/** Rank NEW/SHORTLISTED leads by examMarks or meritScore */
export async function generateMeritListAction(
  _prev: MeritState,
  formData: FormData
): Promise<MeritState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };
  const tid = session.user.tenantId;
  const applyingClass = String(formData.get("applyingClass") || "").trim();

  try {
    const leads = await prisma.admissionLead.findMany({
      where: {
        tenantId: tid,
        status: { in: ["NEW", "CONTACTED", "SHORTLISTED", "OFFERED"] },
        ...(applyingClass ? { applyingClass } : {}),
      },
    });

    const scored = leads
      .map((l) => ({
        ...l,
        score:
          l.meritScore ??
          l.examMarks ??
          (l.status === "OFFERED" ? 100 : l.status === "SHORTLISTED" ? 80 : 50),
      }))
      .sort((a, b) => b.score - a.score);

    let rank = 1;
    for (const row of scored) {
      await prisma.admissionLead.update({
        where: { id: row.id },
        data: { meritScore: row.score, meritRank: rank },
      });
      rank += 1;
    }

    revalidatePath("/tenant/admin/admission");
    revalidatePath("/tenant/admin/admission/merit");
    return {
      success: true,
      message: `${scored.length} লিড র‌্যাঙ্ক করা হয়েছে`,
    };
  } catch (e) {
    console.error(e);
    return { error: "মেধাতালিকা তৈরি হয়নি" };
  }
}
