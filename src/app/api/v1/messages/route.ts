import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.messageLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        channel: true,
        recipient: true,
        subject: true,
        body: true,
        status: true,
        createdAt: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      requestId
    );
  });
}
