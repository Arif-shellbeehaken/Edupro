import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 50), 100);
    const rows = await prisma.transportAssignment.findMany({
      where: { tenantId, status: "ACTIVE" },
      take,
      select: {
        id: true,
        pickupPoint: true,
        studentId: true,
        route: { select: { name: true, vehicleNo: true } },
      },
    });
    const sids = rows.map((r) => r.studentId);
    const students = await prisma.student.findMany({
      where: { tenantId, id: { in: sids } },
      select: { id: true, name: true, nameBn: true, studentId: true },
    });
    const byId = Object.fromEntries(students.map((s) => [s.id, s]));
    return jsonData(
      rows.map((r) => {
        const st = byId[r.studentId];
        return {
          id: r.id,
          routeName: r.route?.name,
          vehicleNo: r.route?.vehicleNo,
          pickupPoint: r.pickupPoint,
          studentName: st?.nameBn || st?.name,
          studentCode: st?.studentId,
        };
      }),
      requestId
    );
  });
}
