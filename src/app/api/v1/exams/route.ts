import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.exam.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
      take,
      select: {
        id: true,
        name: true,
        nameBn: true,
        examType: true,
        startDate: true,
        endDate: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        name: r.nameBn || r.name,
        examType: r.examType,
        startDate: r.startDate?.toISOString().slice(0, 10) ?? null,
        endDate: r.endDate?.toISOString().slice(0, 10) ?? null,
      })),
      requestId
    );
  });
}

const createSchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  examType: z.string().default("MIDTERM"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "name প্রয়োজন" }, { status: 400 });
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  try {
    const exam = await examRepository.createExam({
      tenantId: session.user.tenantId,
      name: parsed.data.name,
      nameBn: parsed.data.nameBn,
      examType: parsed.data.examType,
      startDate: parsed.data.startDate
        ? new Date(parsed.data.startDate)
        : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    });
    return NextResponse.json(
      { data: exam, meta: { requestId } },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_exam_create", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
