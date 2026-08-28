import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";

export async function withApiV1(
  req: Request,
  handler: (ctx: {
    requestId: string;
    tenantId: string;
    userId?: string;
    role?: string;
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session) return error!;
  if (!session.user.tenantId && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "No tenant" }, { status: 403 });
  }
  try {
    return await handler({
      requestId,
      tenantId: session.user.tenantId!,
      userId: session.user.id,
      role: session.user.role,
    });
  } catch (e) {
    logger.error("api_v1_handler_fail", { requestId, err: String(e) });
    return NextResponse.json(
      { error: "Failed", requestId },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}

export function jsonData(
  data: unknown,
  requestId: string,
  meta?: Record<string, unknown>
) {
  return NextResponse.json(
    { data, meta: { requestId, ...meta } },
    { headers: { "X-Request-Id": requestId } }
  );
}
