import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const rows = await prisma.hostelRoom.findMany({
      where: { tenantId, isActive: true },
      orderBy: { roomNumber: "asc" },
      select: {
        id: true,
        roomNumber: true,
        blockName: true,
        capacity: true,
        occupied: true,
        roomType: true,
      },
    });
    return jsonData(rows, requestId);
  });
}
