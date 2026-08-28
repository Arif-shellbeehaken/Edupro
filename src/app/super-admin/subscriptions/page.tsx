import { ExpiryNotifyForm } from "./expiry-notify";
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
import { SubscriptionForms } from "./subscription-forms";

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/login");

  let plans: Awaited<ReturnType<typeof prisma.subscriptionPlanConfig.findMany>> = [];
  let tenants: {
    id: string;
    name: string;
    nameBn: string | null;
    plan: string;
    status: string;
    maxStudents: number;
    maxStaff: number;
    slug: string;
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
        maxStudents: true,
        maxStaff: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });
  } catch {
    /* db */
  }

  const mrr = tenants.reduce((sum, t) => {
    const p = plans.find((x) => x.code === t.plan);
    return sum + (p?.priceMonthly ?? 0);
  }, 0);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="সাবস্ক্রিপশন"
          subtitle="প্ল্যান · টেনান্ট বিলিং"
          userName={session.user.name ?? "Super Admin"}
          userRole={session.user.role}
        />
        <div className="page-pad">
      <ExpiryNotifyForm />
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">টেনান্ট</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenants.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">প্ল্যান</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">MRR (৳)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {mrr.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <SubscriptionForms
            plans={plans.map((p) => ({
              code: p.code,
              name: p.nameBn || p.name,
              priceMonthly: p.priceMonthly,
              maxStudents: p.maxStudents,
              maxStaff: p.maxStaff,
            }))}
            tenants={tenants.map((t) => ({
              id: t.id,
              name: t.nameBn || t.name,
              plan: t.plan,
              status: t.status,
              slug: t.slug,
              maxStudents: t.maxStudents,
              maxStaff: t.maxStaff,
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle>প্ল্যান ক্যাটালগ</CardTitle>
              <CardDescription>SubscriptionPlanConfig</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  কোনো প্ল্যান নেই — নিচে &quot;সিড প্ল্যান&quot; চাপুন
                </p>
              ) : (
                plans.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {p.nameBn || p.name}{" "}
                        <span className="text-xs text-muted-foreground">({p.code})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ৳{p.priceMonthly}/মাস · Max {p.maxStudents} students · {p.maxStaff}{" "}
                        staff
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
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
