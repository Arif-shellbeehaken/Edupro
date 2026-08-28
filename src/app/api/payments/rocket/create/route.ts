import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";

/**
 * Rocket (DBBL) payment create — sandbox stub.
 * Wire merchant credentials via ROCKET_MERCHANT_ID / ROCKET_SECRET when live.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount || 0);
  if (!amount || amount < 1) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const sandbox = process.env.ROCKET_MODE !== "live";
  return NextResponse.json({
    status: "created",
    provider: "rocket",
    sandbox,
    amount,
    paymentId: `rkt_${Date.now()}`,
    redirectUrl: sandbox
      ? `/tenant/admin/finance?rocket=sandbox&amount=${amount}`
      : null,
    message: sandbox
      ? "Rocket sandbox — live credentials set করলে রিডাইরেক্ট পাবেন"
      : "OK",
  });
}
