import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";

const schema = z.object({ allocationId: z.string().min(1) });

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
    return NextResponse.json({ error: "allocationId প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    await operationsRepository.endAllocation({
      allocationId: parsed.data.allocationId,
      tenantId: session.user.tenantId,
    });
    return NextResponse.json({ success: true, meta: { requestId } });
  } catch (e) {
    logger.error("hostel_end", { requestId, err: String(e) });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
