import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { newRequestId, logger } from "@/lib/logger";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";

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

const markSchema = z.object({
  date: z.string().min(8),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum([
          "PRESENT",
          "ABSENT",
          "LATE",
          "HALF_DAY",
          "LEAVE",
          "HOLIDAY",
        ]),
        remarks: z.string().optional(),
      })
    )
    .min(1)
    .max(500),
  notifyAbsent: z.boolean().optional(),
});

/**
 * POST /api/v1/attendance
 * Body: { date, entries: [{ studentId, status }], notifyAbsent? }
 */
export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = session.user.role || "";
  if (
    !["ADMIN", "TEACHER", "ACCOUNTANT", "SUPER_ADMIN"].includes(role) &&
    !session.user.isSuperAdmin
  ) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "তারিখ ও entries প্রয়োজন", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tid = session.user.tenantId;
  setTenantContext({
    tenantId: tid,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  const date = new Date(parsed.data.date);
  date.setHours(0, 0, 0, 0);

  try {
    await attendanceRepository.markMany(
      parsed.data.entries.map((e) => ({
        tenantId: tid,
        studentId: e.studentId,
        date,
        status: e.status,
        remarks: e.remarks,
        markedById: session.user.id,
      }))
    );

    let smsSent = 0;
    if (parsed.data.notifyAbsent) {
      const absentIds = parsed.data.entries
        .filter((e) => e.status === "ABSENT" || e.status === "LATE")
        .map((e) => e.studentId);
      if (absentIds.length > 0) {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const students = await prisma.student.findMany({
          where: { tenantId: tid, id: { in: absentIds }, deletedAt: null },
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            fatherPhone: true,
            guardianPhone: true,
          },
        });
        const statusMap = new Map(
          parsed.data.entries.map((e) => [e.studentId, e.status])
        );
        const dateLabel = date.toLocaleDateString("en-GB");
        for (const s of students) {
          const phone = s.guardianPhone || s.fatherPhone;
          if (!phone) continue;
          const st = statusMap.get(s.id) || "ABSENT";
          const label = st === "LATE" ? "লেট" : "অনুপস্থিত";
          try {
            await communicationRepository.sendMessage({
              tenantId: tid,
              channel: "SMS",
              recipient: phone,
              subject: "Attendance",
              body: `উপস্থিতি নোটিশ: ${s.nameBn || s.name} (${s.studentId}) ${dateLabel} — ${label}। — Edupro`,
              relatedType: "ATTENDANCE",
              relatedId: s.id,
            });
            smsSent += 1;
          } catch {
            /* continue */
          }
        }
      }
    }

    logger.info("api_v1_attendance_mark", {
      requestId,
      count: parsed.data.entries.length,
      smsSent,
    });

    return NextResponse.json(
      {
        success: true,
        count: parsed.data.entries.length,
        smsSent,
        meta: { requestId },
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_attendance_mark_fail", {
      requestId,
      err: String(e),
    });
    return NextResponse.json({ error: "Mark failed" }, { status: 500 });
  }
}
