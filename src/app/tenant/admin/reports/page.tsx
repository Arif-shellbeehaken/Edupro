import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";
import { crmRepository } from "@/infrastructure/database/repositories/crm-repository";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";


function formatBdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let studentCount = 0;
  let hifzCount = 0;
  let staffCount = 0;
  let finance = { totalBilled: 0, totalPaid: 0, outstanding: 0, invoiceCount: 0 };
  let pipeline: Record<string, number> = {};
  let attendanceToday: Record<string, number> = {};

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
      studentCount = await studentRepository.countByTenant();
      const students = await studentRepository.list({ take: 500 });
      hifzCount = students.filter((s) => s.isHifzStudent).length;
      staffCount = await hrRepository.staffCount();
      finance = await financeRepository.collectionSummary();
      pipeline = await crmRepository.pipelineSummary();
      attendanceToday = await attendanceRepository.summaryForDate(new Date());
    } catch {
      /* db */
    }
  }

  const present = attendanceToday.PRESENT ?? 0;
  const absent = attendanceToday.ABSENT ?? 0;
  const admitted = pipeline.ADMITTED ?? 0;
  const newLeads = pipeline.NEW ?? 0;

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="রিপোর্টস"
          subtitle="সারসংক্ষেপ · BANBEIS-ready foundation"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tenant/admin/reports/absenteeism"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              ক্রনিক অনুপস্থিতি রিপোর্ট
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">শিক্ষার্থী</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentCount}</div>
                <p className="text-xs text-muted-foreground">হিফজ: {hifzCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">স্টাফ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">আজকের উপস্থিতি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{present}</div>
                <p className="text-xs text-muted-foreground">অনুপস্থিত: {absent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">ভর্তি লিড (নতুন)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newLeads}</div>
                <p className="text-xs text-muted-foreground">ভর্তি সম্পন্ন: {admitted}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>আর্থিক সারসংক্ষেপ</CardTitle>
                <CardDescription>চালান ও সংগ্রহ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">মোট বিল</span>
                  <span className="font-medium">{formatBdt(finance.totalBilled)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">সংগৃহীত</span>
                  <span className="font-medium text-emerald-600">
                    {formatBdt(finance.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">বকেয়া</span>
                  <span className="font-medium text-amber-600">
                    {formatBdt(finance.outstanding)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">চালান সংখ্যা</span>
                  <span className="font-medium">{finance.invoiceCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ভর্তি পাইপলাইন</CardTitle>
                <CardDescription>CRM স্ট্যাটাস ব্রেকডাউন</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(pipeline).length === 0 ? (
                  <p className="text-sm text-muted-foreground">ডেটা নেই</p>
                ) : (
                  Object.entries(pipeline).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>BANBEIS / বোর্ড রিপোর্ট</CardTitle>
              <CardDescription>
                শিক্ষার্থী সেন্সাস CSV এক্সপোর্ট — বোর্ড রিপোর্টিংয়ের জন্য
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>শিক্ষার্থী সেন্সাস (জেন্ডার, ক্লাস, হিফজ)</li>
                <li>শিক্ষক-কর্মী পরিসংখ্যান</li>
                <li>উপস্থিতি রিপোর্ট</li>
                <li>আর্থিক সংগ্রহ সারসংক্ষেপ</li>
              </ul>
              <Button asChild>
                <a href="/tenant/admin/reports/export" download>
                  BANBEIS Student CSV ডাউনলোড
                </a>
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
