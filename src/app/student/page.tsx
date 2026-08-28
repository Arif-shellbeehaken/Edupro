import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Student Portal — profile slice, attendance, fees, homework.
 * Link User ↔ Student via matching studentId to email local-part or explicit mapping later.
 */
export default async function StudentPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return (
      <div className="page-pad text-center">
        <p>প্রতিষ্ঠান লিংক নেই</p>
        <Button className="mt-4" asChild>
          <Link href="/login">লগইন</Link>
        </Button>
      </div>
    );
  }

  let homework: Awaited<ReturnType<typeof extendedRepository.listHomework>> =
    [];
  try {
    homework = await extendedRepository.listHomework(tenantId);
  } catch {
    /* */
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nameBn: true, name: true },
  });

  const emailLocal = (session.user.email || "").split("@")[0];
  const me = await prisma.student.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { studentId: session.user.email || "" },
        { studentId: emailLocal },
        { name: session.user.name || undefined },
      ].filter((x) => Object.values(x).some(Boolean)),
    },
    include: {
      currentClass: { select: { name: true, nameBn: true } },
      invoices: { take: 8, orderBy: { issueDate: "desc" } },
      attendances: { take: 12, orderBy: { date: "desc" } },
    },
  });

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b bg-card px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-emerald-800">
              শিক্ষার্থী পোর্টাল
            </h1>
            <p className="text-xs text-muted-foreground">
              {tenant?.nameBn || tenant?.name} · {session.user.name}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">লগআউট</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl page-pad">
        {me ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {me.nameBn || me.name}
                {me.currentClass
                  ? ` · ${me.currentClass.nameBn || me.currentClass.name}`
                  : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="mb-1 font-medium">সাম্প্রতিক উপস্থিতি</p>
                {me.attendances.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ডেটা নেই</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {me.attendances.map((a) => (
                      <li
                        key={a.id}
                        className="flex justify-between border-b border-border/50 py-1"
                      >
                        <span>{a.date.toLocaleDateString("bn-BD")}</span>
                        <Badge variant="secondary">{a.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-medium">ফি চালান</p>
                {me.invoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ডেটা নেই</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {me.invoices.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex justify-between border-b border-border/50 py-1"
                      >
                        <span>{inv.invoiceNumber}</span>
                        <span>
                          ৳{inv.totalAmount} · {inv.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="প্রোফাইল লিংক নেই"
            description="অ্যাডমিনকে studentId/ইমেইল ম্যাপিং সেট করতে বলুন"
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>হোমওয়ার্ক / অ্যাসাইনমেন্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {homework.length === 0 ? (
              <EmptyState title="কোনো অ্যাসাইনমেন্ট নেই" />
            ) : (
              homework.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.subject || "—"}
                    {h.dueDate
                      ? ` · due ${h.dueDate.toLocaleDateString("bn-BD")}`
                      : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
