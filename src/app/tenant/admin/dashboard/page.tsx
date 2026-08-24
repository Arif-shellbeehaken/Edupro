import {
  Users,
  UserPlus,
  ClipboardCheck,
  Wallet,
  BookOpen,
  TrendingUp,
  Calendar,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { getTenantBranding } from "@/lib/tenant-branding";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "মোট শিক্ষার্থী",
    value: "1,248",
    change: "+42 এই সেশন",
    icon: Users,
  },
  {
    title: "আজকের উপস্থিতি",
    value: "94.2%",
    change: "১,১৭৬ / ১,২৪৮",
    icon: ClipboardCheck,
  },
  {
    title: "এই মাসের ফি সংগ্রহ",
    value: "৳8,42,000",
    change: "৭৮% টার্গেট",
    icon: Wallet,
  },
  {
    title: "হিফজ অগ্রগতি (গড়)",
    value: "৬৮%",
    change: "+3% গত সপ্তাহ",
    icon: BookOpen,
  },
];

const recentAdmissions = [
  { name: "আব্দুল্লাহ ইবনে মাসউদ", className: "হিফজ - জুজ ৫", date: "২২ আগস্ট", status: "confirmed" },
  { name: "ফাতিমা বিনতে ওমর", className: "দাখিল ১ম", date: "২১ আগস্ট", status: "pending" },
  { name: "মুহাম্মদ ইউসুফ", className: "আলিম ২য়", date: "২০ আগস্ট", status: "confirmed" },
  { name: "আয়েশা সিদ্দিকা", className: "হিফজ - জুজ ১২", date: "১৯ আগস্ট", status: "confirmed" },
];

const upcomingEvents = [
  { title: "মাসিক পরীক্ষা শুরু", date: "২৫ আগস্ট", type: "exam" },
  { title: "অভিভাবক সভা", date: "২৮ আগস্ট", type: "meeting" },
  { title: "ঈদুল আজহা ছুটি", date: "১-৫ সেপ্টেম্বর", type: "holiday" },
];

export default async function TenantAdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branding = await getTenantBranding(session.user.tenantId);
  const tenantName = branding.nameBn || branding.name;

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ড্যাশবোর্ড"
          subtitle={`সেশন ২০২৫-২৬ · ${tenantName}`}
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          {!branding.onboardingDone && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-amber-900">সেটআপ অসম্পূর্ণ</p>
                  <p className="text-sm text-amber-800/80">
                    একাডেমিক বছর, ক্লাস ও ফি কনফিগার করতে উইজার্ড চালান
                  </p>
                </div>
                <Button asChild>
                  <Link href="/tenant/onboarding">অনবোর্ডিং শুরু</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>সাম্প্রতিক ভর্তি</CardTitle>
                  <CardDescription>গত কয়েক দিনের আবেদন</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  সব দেখুন
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAdmissions.map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.className} · {a.date}
                        </p>
                      </div>
                      <Badge variant={a.status === "confirmed" ? "success" : "warning"}>
                        {a.status === "confirmed" ? "নিশ্চিত" : "অপেক্ষমাণ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    আসন্ন ইভেন্ট
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingEvents.map((e) => (
                    <div key={e.title} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.date}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>দ্রুত অ্যাকশন</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <ClipboardCheck className="h-4 w-4" />
                    উপস্থিতি
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Wallet className="h-4 w-4" />
                    ফি গ্রহণ
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <a href="/tenant/admin/hifz">
                      <BookOpen className="h-4 w-4" />
                      হিফজ এন্ট্রি
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <TrendingUp className="h-4 w-4" />
                    রিপোর্ট
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
