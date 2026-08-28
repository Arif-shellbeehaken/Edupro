import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "মোট প্রতিষ্ঠান",
    value: "128",
    change: "+12 এই মাসে",
    icon: Building2,
    color: "text-emerald-600",
  },
  {
    title: "সক্রিয় শিক্ষার্থী",
    value: "48,320",
    change: "+2.4%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "MRR",
    value: "৳4,82,000",
    change: "+8.1%",
    icon: CreditCard,
    color: "text-violet-600",
  },
  {
    title: "Churn Rate",
    value: "1.8%",
    change: "-0.3%",
    icon: TrendingUp,
    color: "text-amber-600",
  },
];

const recentTenants = [
  { name: "দারুল উলূম মাদ্রাসা", plan: "Premium", status: "active", students: 1240 },
  { name: "আল-আমিন স্কুল অ্যান্ড কলেজ", plan: "Standard", status: "active", students: 890 },
  { name: "নূরানী কওমি মাদ্রাসা", plan: "Basic", status: "trial", students: 320 },
  { name: "ইসলামিয়া কলেজ", plan: "Premium", status: "active", students: 2100 },
  { name: "তাজকিয়া মাদ্রাসা", plan: "Standard", status: "suspended", students: 450 },
];

export default async function SuperAdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/tenant/admin/dashboard");

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="সুপার অ্যাডমিন ড্যাশবোর্ড"
          subtitle="প্ল্যাটফর্ম ওভারভিউ"
          userName={session.user.name ?? "Super Admin"}
          userRole={session.user.role}
          isSuperAdmin
        />

        <div className="page-pad">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>সাম্প্রতিক প্রতিষ্ঠান</CardTitle>
                <CardDescription>নতুন ও সাম্প্রতিক আপডেটেড টেনান্ট</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTenants.map((t) => (
                    <div
                      key={t.name}
                      className="list-row border-border/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.students} শিক্ষার্থী · {t.plan}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          t.status === "active"
                            ? "success"
                            : t.status === "trial"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {t.status === "active"
                          ? "সক্রিয়"
                          : t.status === "trial"
                            ? "ট্রায়াল"
                            : "সাসপেন্ডেড"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>সিস্টেম হেলথ</CardTitle>
                <CardDescription>আপটাইম ও সার্ভিস স্ট্যাটাস</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "API Gateway", status: "operational" },
                  { name: "Database", status: "operational" },
                  { name: "SMS Gateway", status: "operational" },
                  { name: "Payment (bKash)", status: "degraded" },
                  { name: "Storage / CDN", status: "operational" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <div className="flex items-center gap-1.5">
                      {s.status === "operational" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Operational</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-amber-600">Degraded</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
