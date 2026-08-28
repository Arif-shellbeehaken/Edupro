import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function LedgerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let fee = { totalBilled: 0, totalPaid: 0, outstanding: 0, invoiceCount: 0 };
  let donations = 0;
  let payroll = 0;
  let canteen = 0;
  let vehicles = 0;
  let recentPayments: {
    id: string;
    amount: number;
    method: string;
    paidAt: Date;
    invoice: { invoiceNumber: string };
  }[] = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    const tid = session.user.tenantId;
    try {
      fee = await financeRepository.collectionSummary();
      const don = await prisma.donation.aggregate({
        where: { tenantId: tid },
        _sum: { amount: true },
      });
      donations = don._sum.amount ?? 0;

      const pay = await prisma.salaryPayment.aggregate({
        where: { tenantId: tid, status: "PAID" },
        _sum: { netSalary: true },
      });
      payroll = pay._sum.netSalary ?? 0;

      try {
        const c = await prisma.canteenSale.aggregate({
          where: { tenantId: tid },
          _sum: { total: true },
        });
        canteen = c._sum.total ?? 0;
      } catch {
        /* model may not be migrated */
      }
      try {
        const v = await prisma.vehicleLog.aggregate({
          where: { tenantId: tid },
          _sum: { amount: true },
        });
        vehicles = v._sum.amount ?? 0;
      } catch {
        /* empty */
      }

      recentPayments = await prisma.payment.findMany({
        where: { tenantId: tid },
        orderBy: { paidAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          method: true,
          paidAt: true,
          invoice: { select: { invoiceNumber: true } },
        },
      });
    } catch {
      /* db */
    }
  }

  const income = fee.totalPaid + donations + canteen;
  const expense = payroll + vehicles;
  const net = income - expense;

  return (
    <div className="page-pad">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">অ্যাকাউন্টিং লেজার</h1>
          <p className="text-sm text-muted-foreground">
            আয় · ব্যয় · নেট (সারসংক্ষেপ)
          </p>
        </div>
        <Link href="/tenant/admin/reports" className="text-sm underline">
          রিপোর্টস
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">মোট আয়</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">{bdt(income)}</p>
            <p className="text-xs text-muted-foreground">
              ফি + যাকাত + ক্যান্টিন
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">মোট ব্যয়</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{bdt(expense)}</p>
            <p className="text-xs text-muted-foreground">পে-রোল + যানবাহন</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">নেট</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bdt(net)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">ফি বকেয়া</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bdt(fee.outstanding)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "ফি আদায়", value: fee.totalPaid },
          { label: "যাকাত/অনুদান", value: donations },
          { label: "ক্যান্টিন", value: canteen },
          { label: "পে-রোল (প্রদত্ত)", value: payroll },
          { label: "যানবাহন খরচ", value: vehicles },
          { label: "ফি বিল (মোট)", value: fee.totalBilled },
        ].map((r) => (
          <Card key={r.label}>
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className="font-semibold tabular-nums">{bdt(r.value)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>সাম্প্রতিক পেমেন্ট</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentPayments.length === 0 && (
            <EmptyState title="এখনো কোনো পেমেন্ট নেই" />
          )}
          {recentPayments.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 text-sm"
            >
              <div>
                <p className="font-mono text-xs">{p.invoice.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.paidAt).toLocaleString("en-GB")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{p.method}</Badge>
                <span className="tabular-nums font-medium">{bdt(p.amount)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
