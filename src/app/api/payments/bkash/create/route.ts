import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { createPayment, isBkashConfigured } from "@/infrastructure/payments/bkash";

/**
 * POST /api/payments/bkash/create
 * Body: { invoiceId: string }
 * Returns: { bkashURL, paymentID, mock }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { invoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invoiceId = body.invoiceId;
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: session.user.tenantId,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const due = invoice.totalAmount - invoice.paidAmount;
  if (due <= 0) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackURL = `${appUrl}/api/payments/bkash/callback`;

  try {
    const result = await createPayment({
      amount: due,
      invoiceNumber: invoice.invoiceNumber,
      callbackURL,
    });

    // Production: PaymentIntent table maps paymentID → invoice.
    return NextResponse.json({
      paymentID: result.paymentID,
      bkashURL: result.bkashURL,
      mock: !isBkashConfigured(),
      amount: due,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "bKash create failed" },
      { status: 502 }
    );
  }
}
