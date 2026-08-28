import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 80), 200);
    const rows = await prisma.timetableSlot.findMany({
      where: { tenantId },
      take,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
        classId: true,
        subject: { select: { name: true, nameBn: true } },
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        room: r.room,
        subject: r.subject?.nameBn || r.subject?.name,
        classId: r.classId,
      })),
      requestId
    );
  });
}
