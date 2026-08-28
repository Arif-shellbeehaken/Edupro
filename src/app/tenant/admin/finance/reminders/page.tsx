import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeReminderForm } from "./reminder-form";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function FeeRemindersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let rows: Awaited<
    ReturnType<typeof financeRepository.listOverdueForReminder>
  > = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
      rows = await financeRepository.listOverdueForReminder({
        daysAhead: 0,
        take: 100,
      });
    } catch {
      /* db */
    }
  }

  const totalDue = rows.reduce((a, r) => a + r.balance, 0);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ফি রিমাইন্ডার"
          subtitle="বকেয়া চালান · অভিভাবক SMS"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="page-pad">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/tenant/admin/finance" className="underline">
              ফিন্যান্স
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/tenant/admin/communication" className="underline">
              যোগাযোগ লগ
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  ওভারডিউ চালান
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{rows.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  মোট বকেয়া
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">{bdt(totalDue)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bulk SMS</CardTitle>
            </CardHeader>
            <CardContent>
              <FeeReminderForm overdueCount={rows.length} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>বকেয়া তালিকা</CardTitle>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <EmptyState title="কোনো ওভারডিউ নেই" description="বকেয়া চালান থাকলে এখানে দেখাবে" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2">চালান</th>
                        <th className="py-2">শিক্ষার্থী</th>
                        <th className="py-2">ডিউ</th>
                        <th className="py-2">বকেয়া</th>
                        <th className="py-2">স্ট্যাটাস</th>
                        <th className="py-2">ফোন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-border/60">
                          <td className="py-2 font-mono text-xs">
                            {r.invoiceNumber}
                          </td>
                          <td className="py-2">
                            {r.student.nameBn || r.student.name}
                            <span className="block text-xs text-muted-foreground">
                              {r.student.studentId}
                            </span>
                          </td>
                          <td className="py-2 text-xs">
                            {new Date(r.dueDate).toLocaleDateString("en-GB")}
                          </td>
                          <td className="py-2 tabular-nums font-medium">
                            {bdt(r.balance)}
                          </td>
                          <td className="py-2">
                            <Badge variant="secondary">{r.status}</Badge>
                          </td>
                          <td className="py-2 text-xs">
                            {r.student.guardianPhone ||
                              r.student.fatherPhone ||
                              "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
