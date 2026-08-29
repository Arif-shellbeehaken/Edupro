import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { inventoryRepository } from "@/infrastructure/database/repositories/inventory-repository";

const schema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

/** POST /api/v1/inventory/stock */
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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "itemId, type, quantity প্রয়োজন" }, { status: 400 });
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  try {
    const txn = await inventoryRepository.stockTxn({
      tenantId: session.user.tenantId,
      itemId: parsed.data.itemId,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      note: parsed.data.note,
      performedById: session.user.id,
    });
    return NextResponse.json(
      { data: txn, meta: { requestId } },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_stock", { requestId, err: String(e) });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
