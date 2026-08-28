import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DonationForms } from "./donation-forms";

export default async function DonationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let donations: Awaited<ReturnType<typeof extendedRepository.listDonations>> = [];
  let summary: Awaited<ReturnType<typeof extendedRepository.donationSummary>> = [];

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
      donations = await extendedRepository.listDonations();
      summary = await extendedRepository.donationSummary();
    } catch { /* */ }
  }

  const total = summary.reduce((s, x) => s + x.total, 0);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader title="যাকাত / অনুদান" subtitle="Donation · Zakat · Receipt" userName={session.user.name ?? "Admin"} userRole={session.user.role} tenantName={tenantName} />
        <div className="page-pad">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট সংগ্রহ</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-emerald-600">৳{total.toLocaleString()}</div></CardContent>
            </Card>
            {summary.slice(0, 3).map((s) => (
              <Card key={s.category}>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{s.category}</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold">৳{s.total.toLocaleString()}</div><p className="text-xs text-muted-foreground">{s.count} টি</p></CardContent>
              </Card>
            ))}
          </div>
          <DonationForms />
          <Card>
            <CardHeader><CardTitle>রসিদ তালিকা</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {donations.length === 0 ? (
                <EmptyState title="কোনো ডোনেশন নেই" description="যাকাত/অনুদান রেকর্ড এখানে দেখাবে" />
              ) : donations.map((d) => (
                <div key={d.id} className="list-row text-sm">
                  <div>
                    <p className="font-medium">{d.donorName} · ৳{d.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{d.receiptNo} · {d.method || "—"} · {d.receivedAt.toLocaleDateString("bn-BD")}</p>
                  </div>
                  <Badge variant="success">{d.category}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
