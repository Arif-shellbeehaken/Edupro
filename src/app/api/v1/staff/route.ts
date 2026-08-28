import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 50), 100);
    const rows = await prisma.staff.findMany({
      where: { tenantId, status: "ACTIVE" },
      take,
      orderBy: { name: "asc" },
      select: {
        id: true,
        employeeId: true,
        name: true,
        nameBn: true,
        designation: true,
        department: true,
        phone: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        staffId: r.employeeId,
        name: r.nameBn || r.name,
        designation: r.designation,
        department: r.department,
        phone: r.phone,
      })),
      requestId
    );
  });
}
