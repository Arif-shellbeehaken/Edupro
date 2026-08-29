import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

/** GET /api/v1/library/books — available books for issue */
export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 50), 100);
    const rows = await prisma.book.findMany({
      where: { tenantId, isActive: true },
      take,
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        titleBn: true,
        author: true,
        availableCopies: true,
        totalCopies: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        title: r.titleBn || r.title,
        author: r.author,
        availableCopies: r.availableCopies,
        totalCopies: r.totalCopies,
      })),
      requestId
    );
  });
}
