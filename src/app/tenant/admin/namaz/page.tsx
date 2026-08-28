import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import {
  namazRepository,
  approximateHijri,
} from "@/infrastructure/database/repositories/namaz-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NamazForm } from "./namaz-form";

export default async function NamazPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let students: { id: string; name: string; studentId: string }[] = [];
  let summary: Awaited<ReturnType<typeof namazRepository.summaryForDate>> = {};
  const today = new Date();
  const hijri = approximateHijri(today);

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
      const s = await studentRepository.list({ status: "ACTIVE", take: 40 });
      students = s.map((x) => ({
        id: x.id,
        name: x.nameBn || x.name,
        studentId: x.studentId,
      }));
      summary = await namazRepository.summaryForDate(today);
    } catch { /* */ }
  }

  const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
  const labels: Record<string, string> = {
    fajr: "ফজর",
    dhuhr: "যোহর",
    asr: "আসর",
    maghrib: "মাগরিব",
    isha: "এশা",
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="নামাজ মনিটরিং"
          subtitle={hijri}
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-5">
            {prayers.map((p) => (
              <Card key={p}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">{labels[p]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-emerald-600">
                    {summary[p]?.present ?? 0}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{summary[p]?.total ?? 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>আজকের নামাজ মার্ক</CardTitle>
              <CardDescription>আবাসিক / মাদ্রাসা শিক্ষার্থী — ৫ ওয়াক্ত</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState title="শিক্ষার্থী নেই" />
              ) : (
                <NamazForm
                  students={students}
                  defaultDate={today.toISOString().slice(0, 10)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
