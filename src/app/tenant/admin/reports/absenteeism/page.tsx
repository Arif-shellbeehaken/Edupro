import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotifyChronicForm } from "./notify-form";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default async function AbsenteeismReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    threshold?: string;
    classId?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;
  const defaults = defaultRange();
  const fromStr = sp.from || defaults.from;
  const toStr = sp.to || defaults.to;
  const threshold = Number(sp.threshold || 20);
  const classId = sp.classId || "";

  let tenantName = "প্রতিষ্ঠান";
  let classes: { id: string; name: string; nameBn: string | null }[] = [];
  let report = {
    spanDays: 0,
    threshold,
    rows: [] as Awaited<
      ReturnType<typeof attendanceRepository.chronicAbsentees>
    >["rows"],
  };

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
      classes = await prisma.class.findMany({
        where: { tenantId: session.user.tenantId, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, nameBn: true },
        take: 100,
      });
      report = await attendanceRepository.chronicAbsentees({
        from: new Date(fromStr),
        to: new Date(toStr),
        thresholdPct: threshold,
        classId: classId || undefined,
      });
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ক্রনিক অনুপস্থিতি"
          subtitle="ঝুঁকি ফ্ল্যাগ · সাপ্তাহিক/মাসিক"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/tenant/admin/reports" className="underline">
              রিপোর্টস
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/tenant/admin/attendance" className="underline">
              উপস্থিতি
            </Link>
          </div>

          <form
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
          >
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">শুরু</span>
              <input
                type="date"
                name="from"
                defaultValue={fromStr}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">শেষ</span>
              <input
                type="date"
                name="to"
                defaultValue={toStr}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">থ্রেশহোল্ড %</span>
              <input
                type="number"
                name="threshold"
                min={5}
                max={100}
                defaultValue={threshold}
                className="h-10 w-24 rounded-md border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">ক্লাস</span>
              <select
                name="classId"
                defaultValue={classId}
                className="h-10 min-w-[160px] rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">সব</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn || c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="h-10 rounded-md border border-border bg-background px-4 text-sm"
            >
              রিপোর্ট
            </button>
          </form>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">পিরিয়ড (দিন)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.spanDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">থ্রেশহোল্ড</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.threshold}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">ফ্ল্যাগড</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">{report.rows.length}</p>
              </CardContent>
            </Card>
          </div>

          <NotifyChronicForm
            from={fromStr}
            to={toStr}
            threshold={threshold}
            classId={classId}
            flaggedCount={report.rows.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>ঝুঁকি তালিকা</CardTitle>
            </CardHeader>
            <CardContent>
              {report.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এই পিরিয়ডে থ্রেশহোল্ডের উপরে কেউ নেই
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2">নাম</th>
                        <th className="py-2">আইডি</th>
                        <th className="py-2">ক্লাস</th>
                        <th className="py-2">অনুপস্থিত দিন</th>
                        <th className="py-2">মার্কড দিন</th>
                        <th className="py-2">%</th>
                        <th className="py-2">ফোন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((r) => (
                        <tr key={r.id} className="border-b border-border/60">
                          <td className="py-2 font-medium">{r.name}</td>
                          <td className="py-2 font-mono text-xs">{r.studentId}</td>
                          <td className="py-2">{r.className}</td>
                          <td className="py-2 tabular-nums">{r.absentDays}</td>
                          <td className="py-2 tabular-nums">{r.markedDays}</td>
                          <td className="py-2">
                            <Badge
                              variant={r.pct >= 40 ? "destructive" : "secondary"}
                            >
                              {r.pct}%
                            </Badge>
                          </td>
                          <td className="py-2 text-xs">{r.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
