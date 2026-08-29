import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.homework.findMany({
      where: { tenantId },
      orderBy: { dueDate: "desc" },
      take,
      select: {
        id: true,
        title: true,
        subjectName: true,
        dueDate: true,
        description: true,
        status: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        subject: r.subjectName,
        dueDate: r.dueDate?.toISOString().slice(0, 10) ?? null,
        description: r.description,
        status: r.status,
      })),
      requestId
    );
  });
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subjectName: z.string().optional(),
  dueDate: z.string().optional(),
  classId: z.string().optional(),
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
    return NextResponse.json({ error: "title প্রয়োজন" }, { status: 400 });
  }

  try {
    const row = await prisma.homework.create({
      data: {
        tenantId: session.user.tenantId,
        title: parsed.data.title,
        description: parsed.data.description,
        subjectName: parsed.data.subjectName,
        classId: parsed.data.classId,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        assignedById: session.user.id,
        status: "ASSIGNED",
      },
    });
    return NextResponse.json(
      { data: row, meta: { requestId } },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_homework_create", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
