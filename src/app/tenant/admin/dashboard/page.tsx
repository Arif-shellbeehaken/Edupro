import {
  Users,
  ClipboardCheck,
  Wallet,
  BookOpen,
  Calendar,
  Activity,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { getTenantBranding } from "@/lib/tenant-branding";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function TenantAdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branding = await getTenantBranding(session.user.tenantId);
  const tenantName = branding.nameBn || branding.name;
  const tid = session.user.tenantId;

  let studentCount = 0;
  let staffCount = 0;
  let presentToday = 0;
  let attendanceMarked = 0;
  let outstanding = 0;
  let collectedMonth = 0;
  let hifzAvg = 0;
  let recentAudit: {
    id: string;
    action: string;
    entityType: string | null;
    createdAt: Date;
  }[] = [];
  let recentLeads: {
    id: string;
    applicantName: string;
    status: string;
    createdAt: Date;
  }[] = [];
  let smsToday = 0;
  let unpaidInvoices = 0;

  if (tid) {
    setTenantContext({
      tenantId: tid,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(
        startOfDay.getFullYear(),
        startOfDay.getMonth(),
        1
      );

      const [
        sc,
        stc,
        att,
        invSum,
        paySum,
        hifz,
        audit,
        leads,
        sms,
        unpaid,
      ] = await Promise.all([
        prisma.student.count({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
        }),
        prisma.staff.count({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
        }),
        prisma.attendance.groupBy({
          by: ["status"],
          where: { tenantId: tid, date: { gte: startOfDay } },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: {
            tenantId: tid,
            status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.payment.aggregate({
          where: { tenantId: tid, paidAt: { gte: startOfMonth } },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: 0 } })),
        prisma.hifzProgress.aggregate({
          where: { tenantId: tid },
          _avg: { totalJuzCompleted: true },
        }).catch(() => ({ _avg: { totalJuzCompleted: null } })),
        prisma.auditLog.findMany({
          where: { tenantId: tid },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            action: true,
            entityType: true,
            createdAt: true,
          },
        }),
        prisma.admissionLead
          .findMany({
            where: { tenantId: tid },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              applicantName: true,
              status: true,
              createdAt: true,
            },
          })
          .catch(() => []),
        prisma.messageLog.count({
          where: { tenantId: tid, createdAt: { gte: startOfDay } },
        }),
        prisma.invoice.count({
          where: {
            tenantId: tid,
            status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
          },
        }),
      ]);

      studentCount = sc;
      staffCount = stc;
      for (const row of att) {
        attendanceMarked += row._count;
        if (row.status === "PRESENT" || row.status === "LATE") {
          presentToday += row._count;
        }
      }
      outstanding = invSum._sum.totalAmount ?? 0;
      unpaidInvoices = unpaid;
      collectedMonth = (paySum as { _sum: { amount: number | null } })._sum
        .amount ?? 0;
      hifzAvg = Math.round(
        ((hifz as { _avg: { totalJuzCompleted: number | null } })._avg
          .totalJuzCompleted ?? 0) * 10
      ) / 10;
      recentAudit = audit;
      recentLeads = leads as typeof recentLeads;
      smsToday = sms;
    } catch (e) {
      console.error("dashboard metrics", e);
    }
  }

  const attendancePct =
    attendanceMarked > 0
      ? Math.round((presentToday / attendanceMarked) * 1000) / 10
      : null;

  const kpi = [
    {
      title: "সক্রিয় শিক্ষার্থী",
      value: studentCount.toLocaleString("en-BD"),
      sub: `স্টাফ ${staffCount}`,
      icon: Users,
    },
    {
      title: "আজকের উপস্থিতি",
      value: attendancePct !== null ? `${attendancePct}%` : "—",
      sub:
        attendanceMarked > 0
          ? `${presentToday} / ${attendanceMarked} মার্ক`
          : "আজও মার্ক হয়নি",
      icon: ClipboardCheck,
    },
    {
      title: "এই মাসের সংগ্রহ",
      value: bdt(collectedMonth),
      sub: `বকেয়া ${bdt(outstanding)} · ${unpaidInvoices} চালান`,
      icon: Wallet,
    },
    {
      title: "হিফজ গড় জুজ",
      value: hifzAvg ? String(hifzAvg) : "—",
      sub: `আজ SMS ${smsToday}`,
      icon: BookOpen,
    },
  ];

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ড্যাশবোর্ড"
          subtitle={tenantName}
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="page-pad">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpi.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  সাম্প্রতিক অ্যাক্টিভিটি
                </CardTitle>
                <CardDescription>অডিট ট্রেইল</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentAudit.length === 0 ? (
                  <EmptyState title="এখনো অ্যাক্টিভিটি নেই" />
                ) : (
                  recentAudit.map((a) => (
                    <div
                      key={a.id}
                      className="list-row text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {a.action}
                          {a.entityType ? ` · ${a.entityType}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.createdAt.toLocaleString("bn-BD")}
                        </p>
                      </div>
                      <Badge variant="secondary">{a.action}</Badge>
                    </div>
                  ))
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tenant/admin/audit">সব অডিট →</Link>
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlusIcon />
                    ভর্তি পাইপলাইন
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentLeads.length === 0 ? (
                    <EmptyState title="কোনো লিড নেই" />
                  ) : (
                    recentLeads.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate">{l.applicantName}</span>
                        <Badge variant="outline">{l.status}</Badge>
                      </div>
                    ))
                  )}
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/tenant/admin/admission">CRM →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">দ্রুত অ্যাকশন</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tenant/admin/attendance">
                      <ClipboardCheck className="h-4 w-4" />
                      উপস্থিতি
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tenant/admin/finance">
                      <Wallet className="h-4 w-4" />
                      ফি
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tenant/admin/communication">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tenant/admin/system">
                      <AlertTriangle className="h-4 w-4" />
                      সিস্টেম
                    </Link>
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

function UserPlusIcon() {
  return <Calendar className="h-4 w-4" />;
}
