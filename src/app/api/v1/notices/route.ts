import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { newRequestId, logger } from "@/lib/logger";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

export async function GET(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notices = await prisma.notice.findMany({
    where: { tenantId: session.user.tenantId, isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      titleBn: true,
      body: true,
      audience: true,
      publishedAt: true,
    },
  });

  return NextResponse.json(
    { data: notices, meta: { requestId } },
    { headers: { "X-Request-Id": requestId } }
  );
}

const createSchema = z.object({
  title: z.string().min(1),
  titleBn: z.string().optional(),
  body: z.string().min(1),
  audience: z.string().optional(),
});

/** POST /api/v1/notices — create published notice */
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
    return NextResponse.json({ error: "title ও body প্রয়োজন" }, { status: 400 });
  }

  try {
    const notice = await prisma.notice.create({
      data: {
        tenantId: session.user.tenantId,
        title: parsed.data.title,
        titleBn: parsed.data.titleBn,
        body: parsed.data.body,
        audience: parsed.data.audience || "ALL",
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    return NextResponse.json(
      { data: notice, meta: { requestId } },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_notice_create_fail", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
