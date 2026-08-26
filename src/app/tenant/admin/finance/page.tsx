import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateInvoiceForm } from "./create-invoice-form";
import { RecordPaymentForm } from "./record-payment-form";
import { BkashPayButton } from "./bkash-pay-button";
import { NagadPayButton } from "./nagad-pay-button";

function formatBdt(n: number) {

  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let summary = { totalBilled: 0, totalPaid: 0, outstanding: 0, invoiceCount: 0 };
  let invoices: Awaited<ReturnType<typeof financeRepository.listInvoices>> = [];
  let students: { id: string; name: string; studentId: string }[] = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (tenant) tenantName = tenant.nameBn || tenant.name;
      summary = await financeRepository.collectionSummary();
      invoices = await financeRepository.listInvoices({ take: 30 });
      const s = await studentRepository.list({ status: "ACTIVE", take: 100 });
      students = s.map((x) => ({
        id: x.id,
        name: x.nameBn || x.name,
        studentId: x.studentId,
      }));
    } catch {
      // db not ready
    }
  }

  const statusLabel: Record<string, string> = {
    ISSUED: "ইস্যু",
    PARTIALLY_PAID: "আংশিক",
    PAID: "পরিশোধিত",
    OVERDUE: "বকেয়া",
    DRAFT: "ড্রাফট",
    CANCELLED: "বাতিল",
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ফি ও অ্যাকাউন্ট"
          subtitle="চালান ও পেমেন্ট"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tenant/admin/finance/reminders"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              ফি রিমাইন্ডার SMS
            </Link>
            <Link
              href="/tenant/admin/finance/passbook"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              পাসবুক
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tenant/admin/finance/passbook"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              ফি পাসবুক / সেটেলমেন্ট
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মোট বিল</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBdt(summary.totalBilled)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">সংগৃহীত</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatBdt(summary.totalPaid)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">বকেয়া</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {formatBdt(summary.outstanding)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">চালান সংখ্যা</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.invoiceCount}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>নতুন চালান</CardTitle>
                <CardDescription>শিক্ষার্থীর জন্য ফি চালান তৈরি</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateInvoiceForm students={students} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>পেমেন্ট রেকর্ড</CardTitle>
                <CardDescription>bKash / Nagad / নগদ</CardDescription>
              </CardHeader>
              <CardContent>
                <RecordPaymentForm
                  invoices={invoices.map((inv) => ({
                    id: inv.id,
                    label: `${inv.invoiceNumber} — ${inv.student.nameBn || inv.student.name}`,
                    due: Math.max(0, inv.totalAmount - inv.discountAmount - inv.paidAmount),
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  সাম্প্রতিক চালান
                </CardTitle>
              </CardHeader>

              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">এখনো কোনো চালান নেই</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {inv.student.nameBn || inv.student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {inv.invoiceNumber} · {formatBdt(inv.totalAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                            <>
                              <BkashPayButton invoiceId={inv.id} />
                              <NagadPayButton invoiceId={inv.id} />
                            </>
                          )}
                          <Badge
                            variant={
                              inv.status === "PAID"
                                ? "success"
                                : inv.status === "OVERDUE"
                                  ? "destructive"
                                  : "warning"
                            }
                          >
                            {statusLabel[inv.status] ?? inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
