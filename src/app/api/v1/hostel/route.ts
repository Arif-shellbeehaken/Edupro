import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 50), 100);
    const rows = await prisma.hostelAllocation.findMany({
      where: { tenantId, status: "ACTIVE" },
      take,
      select: {
        id: true,
        startDate: true,
        studentId: true,
        room: { select: { roomNumber: true, blockName: true } },
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
          room: r.room?.roomNumber,
          building: r.room?.blockName,
          studentName: st?.nameBn || st?.name,
          studentCode: st?.studentId,
          startDate: r.startDate?.toISOString().slice(0, 10) ?? null,
        };
      }),
      requestId
    );
  });
}
