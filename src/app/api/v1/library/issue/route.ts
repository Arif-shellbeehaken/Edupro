import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";

const schema = z.object({
  bookId: z.string().min(1),
  studentId: z.string().optional(),
  days: z.number().int().min(1).max(90).optional(),
});

/** POST /api/v1/library/issue */
export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const role = session.user.role || "";
  if (!["ADMIN", "TEACHER", "ACCOUNTANT", "SUPER_ADMIN"].includes(role) && !session.user.isSuperAdmin) {
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
    return NextResponse.json({ error: "bookId প্রয়োজন" }, { status: 400 });
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  try {
    const issue = await operationsRepository.issueBook({
      tenantId: session.user.tenantId,
      bookId: parsed.data.bookId,
      studentId: parsed.data.studentId,
      days: parsed.data.days,
    });
    return NextResponse.json(
      { data: issue, meta: { requestId } },
      { status: 201, headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_library_issue", { requestId, err: String(e) });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
