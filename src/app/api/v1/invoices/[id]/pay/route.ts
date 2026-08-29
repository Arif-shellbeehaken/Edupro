import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";

const schema = z.object({
  amount: z.number().positive(),
  method: z.string().default("CASH"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

/** POST /api/v1/invoices/:id/pay */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const role = session.user.role || "";
  if (
    !["ADMIN", "ACCOUNTANT", "SUPER_ADMIN"].includes(role) &&
    !session.user.isSuperAdmin
  ) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "amount প্রয়োজন" }, { status: 400 });
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  try {
    const payment = await financeRepository.recordPayment({
      tenantId: session.user.tenantId,
      invoiceId: id,
      amount: Math.round(parsed.data.amount),
      method: parsed.data.method,
      transactionId: parsed.data.transactionId,
      notes: parsed.data.notes,
      receivedById: session.user.id,
    });
    return NextResponse.json(
      { data: payment, meta: { requestId } },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_pay_fail", { requestId, err: String(e) });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json(
      { error: msg === "Invoice not found" ? "চালান পাওয়া যায়নি" : "পেমেন্ট ব্যর্থ" },
      { status: msg === "Invoice not found" ? 404 : 500 }
    );
  }
}
