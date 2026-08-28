import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { approximateHijri } from "@/infrastructure/database/repositories/namaz-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HijriForms } from "./hijri-forms";

export default async function HijriPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let holidays: Awaited<ReturnType<typeof prisma.hijriHoliday.findMany>> = [];
  const todayHijri = approximateHijri(new Date());

  if (session.user.tenantId) {
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
      holidays = await prisma.hijriHoliday.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { createdAt: "asc" },
      });
    } catch { /* */ }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="হিজরি ক্যালেন্ডার"
          subtitle={todayHijri}
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="page-pad">
          <Card>
            <CardHeader>
              <CardTitle>আজকের হিজরি তারিখ</CardTitle>
              <CardDescription>আনুমানিক কনভার্সন (Kuwaiti algorithm)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">{todayHijri}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date().toLocaleDateString("bn-BD", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </CardContent>
          </Card>

          <HijriForms />

          <Card>
            <CardHeader>
              <CardTitle>ইসলামিক / প্রতিষ্ঠানের ছুটি</CardTitle>
              <CardDescription>
                রমজান/ঈদ অটো-অ্যাডজাস্টের ভিত্তি — ম্যানুয়াল তারিখ সেট করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {holidays.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  কোনো ছুটি নেই — &quot;ডিফল্ট ইসলামিক ছুটি সিড&quot; চাপুন
                </p>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{h.titleBn || h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.hijriDate}
                        {h.gregorianDate
                          ? ` · ${h.gregorianDate.toLocaleDateString("bn-BD")}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">{h.holidayType}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
