import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { verifyNagadPayment } from "@/infrastructure/payments/nagad";

/**
 * GET /api/payments/nagad/callback?paymentRefId=...&orderId=...&status=...
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentRefId = url.searchParams.get("paymentRefId");
  const orderIdParam = url.searchParams.get("orderId");
  const status = url.searchParams.get("status");
  const mock = url.searchParams.get("mock");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!paymentRefId) {
    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?nagad=missing_id`);
  }

  if (status === "Aborted" || status === "Failed" || status === "cancel") {
    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?nagad=cancelled`);
  }

  try {
    const verified = await verifyNagadPayment(paymentRefId);
    if (verified.status !== "Success" && mock !== "1") {
      return NextResponse.redirect(`${appUrl}/tenant/admin/finance?nagad=failed`);
    }

    const invoiceNumber =
      orderIdParam ||
      verified.orderId ||
      (paymentRefId.startsWith("NAGAD-MOCK-")
        ? paymentRefId.replace(/^NAGAD-MOCK-/, "").replace(/-\d+$/, "")
        : null);

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
              method: "NAGAD",
              transactionId:
                verified.issuerPaymentRefNo || paymentRefId,
              paidAt: new Date(),
              notes: `Nagad ${mock === "1" ? "mock" : "live"} ${paymentRefId}`,
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

    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?nagad=success`);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${appUrl}/tenant/admin/finance?nagad=error`);
  }
}
