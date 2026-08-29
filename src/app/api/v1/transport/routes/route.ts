import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const rows = await prisma.transportRoute.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nameBn: true,
        vehicleNo: true,
        driverName: true,
        capacity: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        name: r.nameBn || r.name,
        vehicleNo: r.vehicleNo,
        driverName: r.driverName,
        capacity: r.capacity,
      })),
      requestId
    );
  });
}
