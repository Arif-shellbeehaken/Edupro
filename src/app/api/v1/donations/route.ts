import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.donation.findMany({
      where: { tenantId },
      orderBy: { receivedAt: "desc" },
      take,
      select: {
        id: true,
        donorName: true,
        amount: true,
        category: true,
        receivedAt: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        donorName: r.donorName,
        amount: r.amount,
        category: r.category,
        donatedAt: r.receivedAt?.toISOString().slice(0, 10) ?? null,
      })),
      requestId
    );
  });
}
