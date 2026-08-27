import { LeaveBalanceForm } from "./balance-form";
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
import { LeaveForms } from "./leave-forms";

const typeLabel: Record<string, string> = {
  CASUAL: "ক্যাজুয়াল",
  SICK: "অসুস্থতা",
  EARNED: "অর্জিত",
  UNPAID: "বেতনবিহীন",
  MATERNITY: "মাতৃত্ব",
  OTHER: "অন্যান্য",
};

export default async function LeavePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let staff: { id: string; name: string; nameBn: string | null; employeeId: string }[] = [];
  let leaves: Awaited<ReturnType<typeof hrRepository.listLeaves>> = [];

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
      const s = await hrRepository.listStaff({ status: "ACTIVE", take: 100 });
      staff = s.map((x) => ({
        id: x.id,
        name: x.name,
        nameBn: x.nameBn ?? null,
        employeeId: x.employeeId,
      }));
      leaves = await hrRepository.listLeaves({ take: 50 });
    } catch {
      // db
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ছুটি ব্যবস্থাপনা"
          subtitle="আবেদন · অনুমোদন · প্রত্যাখ্যান"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          <LeaveBalanceForm staff={staff} />
          <Link href="/tenant/admin/hr" className="text-sm text-emerald-600 hover:underline">
            ← HR ড্যাশবোর্ড
          </Link>

          <LeaveForms staff={staff} pendingLeaves={leaves.filter((l) => l.status === "PENDING")} />

          <Card>
            <CardHeader>
              <CardTitle>সব ছুটির আবেদন</CardTitle>
              <CardDescription>ইতিহাস ও স্ট্যাটাস</CardDescription>
            </CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো আবেদন নেই</p>
              ) : (
                <div className="space-y-3">
                  {leaves.map((lv) => (
                    <div
                      key={lv.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {lv.staff.nameBn || lv.staff.name}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({lv.staff.employeeId})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {typeLabel[lv.leaveType] ?? lv.leaveType} · {lv.days} দিন ·{" "}
                          {new Date(lv.startDate).toLocaleDateString("bn-BD")} –{" "}
                          {new Date(lv.endDate).toLocaleDateString("bn-BD")}
                          {lv.reason ? ` · ${lv.reason}` : ""}
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
                            : lv.status === "REJECTED"
                              ? "প্রত্যাখ্যাত"
                              : lv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
