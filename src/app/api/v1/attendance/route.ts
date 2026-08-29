import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

/** GET /api/v1/attendance?date=YYYY-MM-DD&take=100 */
export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date");
    const take = Math.min(Number(url.searchParams.get("take") || 100), 500);
    const day = dateStr ? new Date(dateStr) : new Date();
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const rows = await prisma.attendance.findMany({
      where: {
        tenantId,
        date: { gte: day, lt: next },
      },
      select: {
        id: true,
        status: true,
        period: true,
        remarks: true,
        date: true,
        studentId: true,
      },
      orderBy: { date: "desc" },
      take,
    });

    const sids = [...new Set(rows.map((r) => r.studentId))];
    const students = await prisma.student.findMany({
      where: { tenantId, id: { in: sids } },
      select: { id: true, name: true, nameBn: true, studentId: true },
    });
    const byId = Object.fromEntries(students.map((s) => [s.id, s]));

    const data = rows.map((r) => {
      const st = byId[r.studentId];
      return {
        id: r.id,
        status: r.status,
        period: r.period,
        remarks: r.remarks,
        date: r.date.toISOString().slice(0, 10),
        studentId: r.studentId,
        studentName: st?.nameBn || st?.name || null,
        studentCode: st?.studentId || null,
      };
    });

    return jsonData(data, requestId, {
      date: day.toISOString().slice(0, 10),
      take,
    });
  });
}

const postSchema = z.object({
  date: z.string().min(8),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE", "HOLIDAY"]),
        remarks: z.string().optional(),
      })
    )
    .min(1)
    .max(500),
  notifyAbsent: z.boolean().optional(),
});

/** POST /api/v1/attendance — mark bulk attendance */
export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tenantId = session.user.tenantId;
  const date = new Date(parsed.data.date);
  const markedById = session.user.id || "api";

  try {
    await attendanceRepository.markMany(
      parsed.data.entries.map((e) => ({
        tenantId,
        studentId: e.studentId,
        date,
        status: e.status,
        remarks: e.remarks,
        markedById,
      }))
    );

    let smsSent = 0;
    if (parsed.data.notifyAbsent) {
      const statusMap = new Map(
        parsed.data.entries.map((e) => [e.studentId, e.status])
      );
      const absentIds = parsed.data.entries
        .filter((e) => e.status === "ABSENT" || e.status === "LATE")
        .map((e) => e.studentId);
      if (absentIds.length) {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const students = await prisma.student.findMany({
          where: { tenantId, id: { in: absentIds } },
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            guardianPhone: true,
            fatherPhone: true,
          },
        });
        for (const s of students) {
          const phone = s.guardianPhone || s.fatherPhone;
          if (!phone) continue;
          const status = statusMap.get(s.id) || "ABSENT";
          try {
            await communicationRepository.sendMessage({
              tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Attendance",
              body: `উপস্থিতি: ${s.nameBn || s.name} (${s.studentId}) — ${status} (${parsed.data.date})। — Edupro`,
            });
            smsSent++;
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
        marked: parsed.data.entries.length,
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
