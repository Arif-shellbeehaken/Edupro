"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type RiskState = { error?: string; success?: boolean; message?: string };

export async function computeDropoutRiskAction(
  _prev: RiskState,
  _formData: FormData
): Promise<RiskState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };
  const tid = session.user.tenantId;
  const since = new Date(Date.now() - 30 * 86400000);

  try {
    const students = await prisma.student.findMany({
      where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
      take: 2000,
    });

    let flagged = 0;
    for (const s of students) {
      const [absent, unpaid] = await Promise.all([
        prisma.attendance.count({
          where: {
            tenantId: tid,
            studentId: s.id,
            date: { gte: since },
            status: "ABSENT",
          },
        }),
        prisma.invoice.count({
          where: {
            tenantId: tid,
            studentId: s.id,
            status: { in: ["ISSUED", "OVERDUE", "PARTIALLY_PAID"] },
          },
        }),
      ]);
      const risk = Math.min(100, absent * 8 + unpaid * 15);
      if (risk < 25) continue;
      const reasons: string[] = [];
      if (absent >= 3) reasons.push(`${absent} দিন অনুপস্থিত (৩০ দিন)`);
      if (unpaid >= 1) reasons.push(`${unpaid} বকেয়া চালান`);
      await prisma.studentRiskFlag.upsert({
        where: {
          tenantId_studentId: { tenantId: tid, studentId: s.id },
        },
        create: {
          tenantId: tid,
          studentId: s.id,
          riskScore: risk,
          reasonsJson: JSON.stringify(reasons),
        },
        update: {
          riskScore: risk,
          reasonsJson: JSON.stringify(reasons),
          flaggedAt: new Date(),
          resolvedAt: null,
        },
      });
      flagged += 1;
    }
    revalidatePath("/tenant/admin/reports/dropout");
    return { success: true, message: `${flagged} শিক্ষার্থী ফ্ল্যাগ` };
  } catch (e) {
    console.error(e);
    return { error: "হিসাব হয়নি" };
  }
}
