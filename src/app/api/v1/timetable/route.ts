import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { timetableRepository } from "@/infrastructure/database/repositories/timetable-repository";

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
        periodNo: true,
        subject: { select: { name: true, nameBn: true } },
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        dayOfWeek: r.dayOfWeek,
        periodNo: r.periodNo,
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

const createSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  periodNo: z.number().int().min(1).max(12),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  room: z.string().optional(),
});

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "day, period, time প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    const slot = await timetableRepository.upsertSlot({
      tenantId: session.user.tenantId,
      dayOfWeek: parsed.data.dayOfWeek,
      periodNo: parsed.data.periodNo,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      room: parsed.data.room,
    });
    return NextResponse.json({ data: slot, meta: { requestId } }, { status: 201 });
  } catch (e) {
    logger.error("timetable_upsert", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
