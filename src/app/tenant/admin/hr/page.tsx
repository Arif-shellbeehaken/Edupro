import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  CalendarDays,
  Wallet,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";
import { Sidebar } from "@/components/layout/sidebar";
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

export default async function HrDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let staffCount = 0;
  let pendingLeaves = 0;
  let staffList: Awaited<ReturnType<typeof hrRepository.listStaff>> = [];
  let recentLeaves: Awaited<ReturnType<typeof hrRepository.listLeaves>> = [];
  let payrollRuns: Awaited<ReturnType<typeof hrRepository.listPayrollRuns>> = [];

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
      staffCount = await hrRepository.staffCount();
      staffList = await hrRepository.listStaff({ take: 10 });
      recentLeaves = await hrRepository.listLeaves({ take: 5 });
      pendingLeaves = (
        await hrRepository.listLeaves({ status: "PENDING", take: 100 })
      ).length;
      payrollRuns = await hrRepository.listPayrollRuns();
    } catch {
      // db not ready
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        type="tenant"
        institutionName={tenantName}
        user={{
          name: session.user.name ?? "Admin",
          role: session.user.role,
          email: session.user.email ?? undefined,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="HR ও পে-রোল"
          subtitle="স্টাফ · ছুটি · স্যালারি"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">সক্রিয় স্টাফ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">পেন্ডিং ছুটি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{pendingLeaves}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">পে-রোল রান</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollRuns.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/tenant/admin/hr/staff/new">
                <UserPlus className="h-4 w-4" />
                নতুন স্টাফ
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tenant/admin/hr/leave">
                <CalendarDays className="h-4 w-4" />
                ছুটি ব্যবস্থাপনা
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tenant/admin/hr/payroll">
                <Wallet className="h-4 w-4" />
                পে-রোল
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  স্টাফ তালিকা
                </CardTitle>
                <CardDescription>সাম্প্রতিক / সক্রিয় কর্মী</CardDescription>
              </CardHeader>
              <CardContent>
                {staffList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    কোনো স্টাফ নেই।{" "}
                    <Link href="/tenant/admin/hr/staff/new" className="text-emerald-600 underline">
                      প্রথম স্টাফ যোগ করুন
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {staffList.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{s.nameBn || s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.employeeId} · {s.designation}
                            {s.basicSalary > 0
                              ? ` · ৳${s.basicSalary.toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                        <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>
                          {s.status === "ACTIVE" ? "সক্রিয়" : s.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  সাম্প্রতিক ছুটি
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentLeaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">কোনো ছুটির আবেদন নেই</p>
                ) : (
                  <div className="space-y-3">
                    {recentLeaves.map((lv) => (
                      <div
                        key={lv.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {lv.staff.nameBn || lv.staff.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lv.leaveType} · {lv.days} দিন
                          </p>
                        </div>
                        <Badge
                          variant={
                            lv.status === "APPROVED"
                              ? "success"
                              : lv.status === "REJECTED"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {lv.status === "PENDING"
                            ? "পেন্ডিং"
                            : lv.status === "APPROVED"
                              ? "অনুমোদিত"
                              : "প্রত্যাখ্যাত"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
