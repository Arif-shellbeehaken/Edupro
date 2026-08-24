import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RevenuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/login");

  let plans: Awaited<ReturnType<typeof prisma.subscriptionPlanConfig.findMany>> =
    [];
  let tenants: {
    id: string;
    name: string;
    nameBn: string | null;
    plan: string;
    status: string;
    slug: string;
    createdAt: Date;
  }[] = [];

  try {
    plans = await prisma.subscriptionPlanConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    tenants = await prisma.tenant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        nameBn: true,
        plan: true,
        status: true,
        slug: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    /* db */
  }

  const planPrice = (code: string) =>
    plans.find((p) => p.code === code)?.priceMonthly ?? 0;

  const activeTenants = tenants.filter((t) => t.status === "ACTIVE");
  const trialTenants = tenants.filter((t) => t.status === "TRIAL");
  const suspended = tenants.filter((t) => t.status === "SUSPENDED");

  const mrr = activeTenants.reduce((s, t) => s + planPrice(t.plan), 0);
  const arr = mrr * 12;
  const trialValue = trialTenants.reduce((s, t) => s + planPrice(t.plan), 0);

  // Plan breakdown
  const byPlan = new Map<string, { count: number; mrr: number }>();
  for (const t of activeTenants) {
    const cur = byPlan.get(t.plan) ?? { count: 0, mrr: 0 };
    cur.count += 1;
    cur.mrr += planPrice(t.plan);
    byPlan.set(t.plan, cur);
  }

  // Last 6 months signups (simple bucket)
  const now = new Date();
  const monthBuckets: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const count = tenants.filter((t) => {
      const c = t.createdAt;
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    monthBuckets.push({ label, count });
  }
  const maxSignups = Math.max(1, ...monthBuckets.map((m) => m.count));

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="রেভিনিউ"
          subtitle="MRR · ARR · Tenant health"
          userName={session.user.name ?? "Super Admin"}
          userRole={session.user.role}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ৳{mrr.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">মাসিক রিকারিং</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">ARR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৳{arr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">বার্ষিক রান-রেট</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Active tenants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeTenants.length}</div>
                <p className="text-xs text-muted-foreground">
                  Trial {trialTenants.length} · Suspended {suspended.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Trial pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  ৳{trialValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  সম্ভাব্য MRR যদি convert হয়
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>প্ল্যান বিতরণ (Active)</CardTitle>
                <CardDescription>কোড · সংখ্যা · MRR অবদান</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {byPlan.size === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    কোনো active tenant নেই — Subscriptions থেকে প্ল্যান সিড করুন
                  </p>
                ) : (
                  Array.from(byPlan.entries()).map(([code, v]) => (
                    <div
                      key={code}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{code}</Badge>
                        <span>{v.count} tenant</span>
                      </div>
                      <span className="font-medium">
                        ৳{v.mrr.toLocaleString()}/mo
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>নতুন টেনান্ট (৬ মাস)</CardTitle>
                <CardDescription>Signup volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-36 items-end gap-2">
                  {monthBuckets.map((m) => (
                    <div
                      key={m.label}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {m.count}
                      </span>
                      <div
                        className="w-full rounded-t bg-emerald-500/80"
                        style={{
                          height: `${Math.max(4, (m.count / maxSignups) * 100)}%`,
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>সব টেনান্ট</CardTitle>
              <CardDescription>প্ল্যান · স্ট্যাটাস · মাসিক মূল্য</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো tenant নেই</p>
              ) : (
                tenants.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.nameBn || t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.slug} ·{" "}
                        {t.createdAt.toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t.plan}</Badge>
                      <Badge
                        variant={
                          t.status === "ACTIVE"
                            ? "success"
                            : t.status === "TRIAL"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {t.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ৳{planPrice(t.plan).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
