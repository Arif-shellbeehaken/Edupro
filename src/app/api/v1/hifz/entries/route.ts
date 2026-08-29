import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hifzRepository } from "@/infrastructure/database/repositories/hifz-repository";

const schema = z.object({
  studentId: z.string().min(1),
  date: z.string().optional(),
  stream: z.enum(["SABAK", "SABKI", "MANZIL"]).default("SABAK"),
  fromJuz: z.number().int().min(1).max(30),
  fromPage: z.number().int().min(1),
  toJuz: z.number().int().min(1).max(30),
  toPage: z.number().int().min(1),
  quality: z.string().default("GOOD"),
  teacherNote: z.string().optional(),
  mistakesCount: z.number().int().optional(),
});

/** POST /api/v1/hifz/entries */
export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId || !session.user.id) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const role = session.user.role || "";
  if (!["ADMIN", "TEACHER", "SUPER_ADMIN"].includes(role) && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "studentId, juz/page প্রয়োজন", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  try {
    const entry = await hifzRepository.createEntry({
      tenantId: session.user.tenantId,
      studentId: parsed.data.studentId,
      teacherId: session.user.id,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      stream: parsed.data.stream,
      fromJuz: parsed.data.fromJuz,
      fromPage: parsed.data.fromPage,
      toJuz: parsed.data.toJuz,
      toPage: parsed.data.toPage,
      quality: parsed.data.quality,
      teacherNote: parsed.data.teacherNote,
      mistakesCount: parsed.data.mistakesCount,
    });
    return NextResponse.json(
      { data: entry, meta: { requestId } },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_hifz_entry", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
