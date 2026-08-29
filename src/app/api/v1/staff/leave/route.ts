import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";

const schema = z.object({
  staffId: z.string().min(1),
  leaveType: z.string().default("CASUAL"),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  reason: z.string().optional(),
});

/** POST /api/v1/staff/leave */
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
    return NextResponse.json({ error: "staffId ও তারিখ প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    const leave = await hrRepository.createLeave({
      tenantId: session.user.tenantId,
      staffId: parsed.data.staffId,
      leaveType: parsed.data.leaveType,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
    });
    return NextResponse.json({ data: leave, meta: { requestId } }, { status: 201 });
  } catch (e) {
    logger.error("staff_leave", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
