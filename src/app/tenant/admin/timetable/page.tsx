import { SubstituteForm } from "./substitute-form";
import { PublishDayForm } from "./publish-day-form";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import {
  timetableRepository,
  DAY_NAMES_BN,
} from "@/infrastructure/database/repositories/timetable-repository";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimetableDigestForm } from "./digest-form";
import { TimetableForm } from "./timetable-form";

export default async function TimetablePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let slots: Awaited<ReturnType<typeof timetableRepository.listSlots>> = [];
  let subjects: { id: string; name: string }[] = [];

  let classes: { id: string; name: string; nameBn: string | null }[] = [];
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
      slots = await timetableRepository.listSlots();
      const subs = await examRepository.listSubjects();
      subjects = subs.map((s) => ({ id: s.id, name: s.nameBn || s.name }));
      classes = await prisma.class.findMany({
        where: { tenantId: session.user.tenantId, deletedAt: null },
        select: { id: true, name: true, nameBn: true },
        orderBy: { name: "asc" },
        take: 50,
      });
    } catch {
      // db
    }
  }

  // Group by day
  const byDay: Record<number, typeof slots> = {};
  for (let d = 0; d < 7; d++) byDay[d] = [];
  for (const s of slots) {
    byDay[s.dayOfWeek]?.push(s);
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ক্লাস রুটিন"
          subtitle="Timetable"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="page-pad">
          <PublishDayForm classes={classes.map((c) => ({ id: c.id, name: c.nameBn || c.name }))} />
          <TimetableDigestForm classes={classes} />
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">স্লট যোগ / আপডেট</CardTitle>
                <CardDescription>দিন · পিরিয়ড · সময় · বিষয়</CardDescription>
              </CardHeader>
              <CardContent>
                <TimetableForm subjects={subjects} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  সাপ্তাহিক রুটিন
                </CardTitle>
                <CardDescription>{slots.length} টি স্লট</CardDescription>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    এখনো কোনো স্লট নেই। বাম পাশ থেকে যোগ করুন।
                  </p>
                ) : (
                  <div className="space-y-4">
                    {DAY_NAMES_BN.map((dayName, dayIdx) => {
                      const daySlots = byDay[dayIdx] ?? [];
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={dayIdx}>
                          <h3 className="mb-2 text-sm font-semibold text-emerald-700">
                            {dayName}
                          </h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                              >
                                <div className="font-medium">
                                  পিরিয়ড {slot.periodNo} · {slot.startTime}–{slot.endTime}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {slot.subject?.nameBn || slot.subject?.name || "—"}
                                  {slot.room ? ` · রুম ${slot.room}` : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
              <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">সাবস্টিটিউট টিচার</h2>
          <SubstituteForm />
        </div>
      </main>
    </>
  );
}
