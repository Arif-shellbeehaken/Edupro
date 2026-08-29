import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(
      Number(new URL(req.url).searchParams.get("take") || 40),
      100
    );
    const rows = await prisma.messageLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        channel: true,
        recipient: true,
        subject: true,
        body: true,
        status: true,
        createdAt: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      requestId
    );
  });
}

const sendSchema = z.object({
  recipient: z.string().min(5),
  body: z.string().min(1).max(1000),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL", "IN_APP"]).default("SMS"),
  subject: z.string().optional(),
});

/** POST /api/v1/messages — send SMS / log message */
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
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "recipient ও body প্রয়োজন" },
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
    const log = await communicationRepository.sendMessage({
      tenantId: session.user.tenantId,
      channel: parsed.data.channel,
      recipient: parsed.data.recipient,
      subject: parsed.data.subject,
      body: parsed.data.body,
      relatedType: "MOBILE",
    });
    return NextResponse.json(
      { data: log, meta: { requestId } },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_message_send", { requestId, err: String(e) });
    return NextResponse.json({ error: "পাঠানো ব্যর্থ" }, { status: 500 });
  }
}
