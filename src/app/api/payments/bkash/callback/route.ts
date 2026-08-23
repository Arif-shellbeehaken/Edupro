import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { executePayment } from "@/infrastructure/payments/bkash";

/**
 * GET /api/payments/bkash/callback?paymentID=...&status=...
 * bKash redirects here after user approves payment.
 *
 * Note: Production should verify signature / re-query status and map
 * paymentID → invoice via a PaymentIntent table. Mock mode completes
 * when status=success.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentID = url.searchParams.get("paymentID");
  const status = url.searchParams.get("status");
  const mock = url.searchParams.get("mock");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!paymentID) {
    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?bkash=missing_id`);
  }

  if (status === "cancel" || status === "failure") {
    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?bkash=cancelled`);
  }

  try {
    const executed = await executePayment(paymentID);
    if (
      executed.transactionStatus !== "Completed" &&
      executed.statusCode !== "0000" &&
      mock !== "1"
    ) {
      return NextResponse.redirect(`${appUrl}/tenant/admin/finance?bkash=failed`);
    }

    // Extract invoice number from mock paymentID pattern MOCK-{invoiceNumber}-{ts}
    let invoiceNumber: string | null = null;
    if (paymentID.startsWith("MOCK-")) {
      const parts = paymentID.split("-");
      if (parts.length >= 3) {
        invoiceNumber = parts.slice(1, -1).join("-");
      }
    }

    if (invoiceNumber) {
      const invoice = await prisma.invoice.findFirst({
        where: { invoiceNumber },
      });
      if (invoice && invoice.paidAmount < invoice.totalAmount) {
        const due = invoice.totalAmount - invoice.paidAmount;
        await prisma.$transaction(async (tx) => {
          await tx.payment.create({
            data: {
              tenantId: invoice.tenantId,
              invoiceId: invoice.id,
              amount: due,
              method: "BKASH",
              transactionId: executed.trxID,
              paidAt: new Date(),
              notes: `bKash ${mock === "1" ? "mock" : "live"} ${paymentID}`,
            },
          });
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: invoice.totalAmount,
              status: "PAID",
            },
          });
        });
      }
    }

    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?bkash=success`);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?bkash=error`);
  }
}
