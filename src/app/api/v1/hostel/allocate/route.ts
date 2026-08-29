import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";

const schema = z.object({
  roomId: z.string().min(1),
  studentId: z.string().min(1),
  notes: z.string().optional(),
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
  if (!["ADMIN", "ACCOUNTANT", "SUPER_ADMIN"].includes(role) && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "roomId ও studentId প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    const alloc = await operationsRepository.allocateRoom({
      tenantId: session.user.tenantId,
      roomId: parsed.data.roomId,
      studentId: parsed.data.studentId,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ data: alloc, meta: { requestId } }, { status: 201 });
  } catch (e) {
    logger.error("hostel_allocate", { requestId, err: String(e) });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
