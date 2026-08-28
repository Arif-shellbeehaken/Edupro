import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { newRequestId } from "@/lib/logger";

/** GET /api/v1/attendance?date=YYYY-MM-DD */
export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession();
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date");
  const day = dateStr ? new Date(dateStr) : new Date();
  day.setHours(0, 0, 0, 0);
  const next = new Date(day);
  next.setDate(next.getDate() + 1);

  const rows = await prisma.attendance.findMany({
    where: {
      tenantId: session.user.tenantId,
      date: { gte: day, lt: next },
    },
    select: {
      studentId: true,
      status: true,
      period: true,
      remarks: true,
    },
    take: 5000,
  });

  return NextResponse.json(
    { data: rows, meta: { date: day.toISOString().slice(0, 10), requestId } },
    { headers: { "X-Request-Id": requestId } }
  );
}
