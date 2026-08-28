import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";
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
import { PayrollForms } from "./payroll-forms";

const MONTHS_BN = [
  "",
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let runs: Awaited<ReturnType<typeof hrRepository.listPayrollRuns>> = [];
  let latestPayments: {
    id: string;
    netSalary: number;
    status: string;
    staffName: string;
    employeeId: string;
    designation: string;
    grossSalary: number;
    deduction: number;
  }[] = [];
  let latestRunId: string | null = null;

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
      runs = await hrRepository.listPayrollRuns();
      if (runs[0]) {
        latestRunId = runs[0].id;
        const full = await hrRepository.getPayrollRun(runs[0].id);
        if (full) {
          latestPayments = full.payments.map((p) => ({
            id: p.id,
            netSalary: p.netSalary,
            status: p.status,
            grossSalary: p.grossSalary,
            deduction: p.deduction,
            staffName: p.staff.nameBn || p.staff.name,
            employeeId: p.staff.employeeId,
            designation: p.staff.designation,
          }));
        }
      }
    } catch {
      // db
    }
  }

  const now = new Date();

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="পে-রোল"
          subtitle="মাসিক স্যালারি প্রসেস ও পেমেন্ট"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          <Link href="/tenant/admin/hr" className="text-sm text-emerald-600 hover:underline">
            ← HR ড্যাশবোর্ড
          </Link>

          <PayrollForms
            defaultMonth={now.getMonth() + 1}
            defaultYear={now.getFullYear()}
            latestRunId={latestRunId}
            payments={latestPayments}
          />

          <Card>
            <CardHeader>
              <CardTitle>পে-রোল হিস্ট্রি</CardTitle>
              <CardDescription>মাসভিত্তিক রান</CardDescription>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <EmptyState title="কোনো পে-রোল রান নেই" description="মাসিক পে-রোল জেনারেট করুন" />
              ) : (
                <div className="space-y-3">
                  {runs.map((run) => {
                    const totalNet = run.payments.reduce((s, p) => s + p.netSalary, 0);
                    const paidCount = run.payments.filter((p) => p.status === "PAID").length;
                    return (
                      <div
                        key={run.id}
                        className="flex flex-col gap-2 rounded-lg border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {MONTHS_BN[run.month]} {run.year}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {run._count.payments} জন · মোট ৳{totalNet.toLocaleString()} · পেইড{" "}
                            {paidCount}/{run._count.payments}
                          </p>
                        </div>
                        <Badge
                          variant={
                            run.status === "PAID"
                              ? "success"
                              : run.status === "PROCESSED"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {run.status === "PAID"
                            ? "পরিশোধিত"
                            : run.status === "PROCESSED"
                              ? "প্রসেসড"
                              : run.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
