import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";

const schema = z.object({
  routeId: z.string().min(1),
  studentId: z.string().min(1),
  pickupPoint: z.string().optional(),
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "routeId ও studentId প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    const row = await operationsRepository.assignStudent({
      tenantId: session.user.tenantId,
      routeId: parsed.data.routeId,
      studentId: parsed.data.studentId,
      pickupPoint: parsed.data.pickupPoint,
    });
    return NextResponse.json({ data: row, meta: { requestId } }, { status: 201 });
  } catch (e) {
    logger.error("transport_assign", { requestId, err: String(e) });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
