import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.donation.findMany({
      where: { tenantId },
      orderBy: { receivedAt: "desc" },
      take,
      select: {
        id: true,
        donorName: true,
        amount: true,
        category: true,
        receivedAt: true,
        receiptNo: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        donorName: r.donorName,
        amount: r.amount,
        category: r.category,
        donatedAt: r.receivedAt?.toISOString().slice(0, 10) ?? null,
        receiptNo: r.receiptNo,
      })),
      requestId
    );
  });
}

const createSchema = z.object({
  donorName: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().default("GENERAL"),
  donorPhone: z.string().optional(),
  method: z.string().optional(),
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
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "donorName ও amount প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    const row = await extendedRepository.createDonation({
      tenantId: session.user.tenantId,
      donorName: parsed.data.donorName,
      amount: Math.round(parsed.data.amount),
      category: parsed.data.category,
      donorPhone: parsed.data.donorPhone,
      method: parsed.data.method,
      notes: parsed.data.notes,
      receivedById: session.user.id,
    });
    return NextResponse.json({ data: row, meta: { requestId } }, { status: 201 });
  } catch (e) {
    logger.error("donation_create", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
