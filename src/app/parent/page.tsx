import Link from "next/link";
import { prisma } from "@/infrastructure/database/prisma";
import {
  requireParentSession,
  parentLogoutAction,
} from "@/application/use-cases/portal/parent-session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ParentPortalPage() {
  const session = await requireParentSession();

  const students = await prisma.student.findMany({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { guardianPhone: session.phone },
        { fatherPhone: session.phone },
      ],
    },
    include: {
      currentClass: { select: { name: true, nameBn: true } },
      hifzProgress: true,
      invoices: { take: 5, orderBy: { issueDate: "desc" } },
      attendances: {
        take: 14,
        orderBy: { date: "desc" },
        select: { status: true, date: true },
      },
    },
    take: 20,
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, nameBn: true },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              অভিভাবক পোর্টাল
            </p>
            <p className="text-xs text-muted-foreground">
              {tenant?.nameBn || tenant?.name || "প্রতিষ্ঠান"} · {session.phone}
            </p>
          </div>
          <form action={parentLogoutAction}>
            <Button type="submit" variant="outline" size="sm">
              লগআউট
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 pb-10">
        <p className="text-sm text-muted-foreground">
          সন্তানের উপস্থিতি, ফি ও হিফজ — রিড-অনলি
        </p>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              এই নম্বরে কোনো সক্রিয় শিক্ষার্থী লিংক নেই
            </CardContent>
          </Card>
        ) : (
          students.map((s) => {
            const unpaid = s.invoices.filter(
              (i) => i.status !== "PAID" && i.status !== "CANCELLED"
            ).length;
            const present = s.attendances.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length;
            const totalAtt = s.attendances.length;
            return (
              <Card key={s.id} className="overflow-hidden shadow-sm">
                <CardHeader className="bg-card pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
                    <span>{s.nameBn || s.name}</span>
                    {s.isHifzStudent && (
                      <Badge variant="success">হিফজ</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {s.studentId}
                    {s.currentClass
                      ? ` · ${s.currentClass.nameBn || s.currentClass.name}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        হিফজ জুজ
                      </p>
                      <p className="text-xl font-bold text-emerald-800">
                        {s.hifzProgress?.totalJuzCompleted ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        বকেয়া চালান
                      </p>
                      <p className="text-xl font-bold text-amber-800">
                        {unpaid}
                      </p>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        উপস্থিতি ১৪ দিন
                      </p>
                      <p className="text-xl font-bold text-sky-800">
                        {totalAtt ? `${present}/${totalAtt}` : "—"}
                      </p>
                    </div>
                  </div>

                  {s.attendances.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        সাম্প্রতিক উপস্থিতি
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {[...s.attendances].reverse().map((a, i) => {
                          const color =
                            a.status === "PRESENT"
                              ? "bg-emerald-500"
                              : a.status === "LATE"
                                ? "bg-amber-400"
                                : a.status === "ABSENT"
                                  ? "bg-red-400"
                                  : "bg-zinc-300";
                          return (
                            <span
                              key={i}
                              title={`${a.date.toISOString().slice(0, 10)} · ${a.status}`}
                              className={`h-3 w-3 rounded-full ${color}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {s.invoices.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        সাম্প্রতিক চালান
                      </p>
                      {s.invoices.slice(0, 3).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <span>{inv.invoiceNumber}</span>
                          <span className="font-medium">
                            ৳{inv.totalAmount.toLocaleString("en-BD")}
                          </span>
                          <Badge
                            variant={
                              inv.status === "PAID" ? "success" : "warning"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={`/parent/fees?studentId=${s.id}`}>
                      ফি পাসবুক দেখুন
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
