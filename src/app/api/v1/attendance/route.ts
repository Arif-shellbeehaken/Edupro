import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { newRequestId, logger } from "@/lib/logger";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

/** GET /api/v1/attendance?date=YYYY-MM-DD&take=100 */
export async function GET(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session) return error!;
  if (!session.user.tenantId && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "No tenant" }, { status: 403 });
  }

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const take = Math.min(Number(url.searchParams.get("take") || 100), 500);
  const day = dateStr ? new Date(dateStr) : new Date();
  day.setHours(0, 0, 0, 0);
  const next = new Date(day);
  next.setDate(next.getDate() + 1);
  const tid = session.user.tenantId!;

  try {
    const rows = await prisma.attendance.findMany({
      where: {
        tenantId: tid,
        date: { gte: day, lt: next },
      },
      select: {
        id: true,
        status: true,
        period: true,
        remarks: true,
        date: true,
        student: {
          select: { name: true, nameBn: true, studentId: true },
        },
      },
      orderBy: { date: "desc" },
      take,
    });

    const data = rows.map((r) => ({
      id: r.id,
      status: r.status,
      period: r.period,
      remarks: r.remarks,
      date: r.date.toISOString().slice(0, 10),
      studentName: r.student?.nameBn || r.student?.name || null,
      studentCode: r.student?.studentId || null,
    }));

    return NextResponse.json(
      {
        data,
        meta: { date: day.toISOString().slice(0, 10), take, requestId },
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_attendance_fail", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
