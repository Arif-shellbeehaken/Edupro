import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 50), 100);
    const rows = await prisma.inventoryItem.findMany({
      where: { tenantId },
      take,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nameBn: true,
        quantity: true,
        unit: true,
        minStock: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        name: r.nameBn || r.name,
        quantity: r.quantity,
        unit: r.unit,
        reorderLevel: r.minStock,
      })),
      requestId
    );
  });
}
