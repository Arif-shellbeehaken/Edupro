import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.hifzProgress.findMany({
      where: { tenantId },
      take,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        currentJuz: true,
        currentSurah: true,
        totalPagesMemorized: true,
        totalJuzCompleted: true,
        student: { select: { name: true, nameBn: true, studentId: true } },
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        studentName: r.student?.nameBn || r.student?.name,
        studentCode: r.student?.studentId,
        currentJuz: r.currentJuz,
        currentSurah: r.currentSurah,
        memorizedPages: r.totalPagesMemorized,
        juzCompleted: r.totalJuzCompleted,
      })),
      requestId
    );
  });
}
