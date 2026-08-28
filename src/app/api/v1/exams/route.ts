import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.exam.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
      take,
      select: {
        id: true,
        name: true,
        nameBn: true,
        examType: true,
        startDate: true,
        endDate: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        name: r.nameBn || r.name,
        examType: r.examType,
        startDate: r.startDate?.toISOString().slice(0, 10) ?? null,
        endDate: r.endDate?.toISOString().slice(0, 10) ?? null,
      })),
      requestId
    );
  });
}
