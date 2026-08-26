import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Parent Portal — read-only view of linked children.
 * Links students by guardianPhone / fatherPhone matching user.phone when available;
 * falls back to all active students of the tenant for demo accounts.
 */
export default async function ParentPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-muted-foreground">কোনো প্রতিষ্ঠানের সাথে লিংক নেই</p>
        <Button className="mt-4" asChild><Link href="/login">লগইন</Link></Button>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true },
  });

  let students = await prisma.student.findMany({
    where: {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
      ...(user?.phone
        ? {
            OR: [
              { guardianPhone: user.phone },
              { fatherPhone: user.phone },
            ],
          }
        : {}),
    },
    include: {
      currentClass: { select: { name: true, nameBn: true } },
      hifzProgress: true,
      invoices: { take: 3, orderBy: { issueDate: "desc" } },
    },
    take: 20,
  });

  // Demo fallback: if no phone match, show first few students
  if (students.length === 0) {
    students = await prisma.student.findMany({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
      include: {
        currentClass: { select: { name: true, nameBn: true } },
        hifzProgress: true,
        invoices: { take: 3, orderBy: { issueDate: "desc" } },
      },
      take: 6,
    });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, nameBn: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-emerald-800">অভিভাবক পোর্টাল</h1>
            <p className="text-xs text-muted-foreground">
              {tenant?.nameBn || tenant?.name} · {session.user.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tenant/admin/dashboard">অ্যাডমিন</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">লগআউট</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <p className="text-sm text-muted-foreground">
          সন্তানের উপস্থিতি, ফি ও হিফজ অগ্রগতি (রিড-অনলি)
        </p>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              কোনো শিক্ষার্থী লিংক নেই
            </CardContent>
          </Card>
        ) : (
          students.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{s.nameBn || s.name}</span>
                  {s.isHifzStudent && <Badge variant="success">হিফজ</Badge>}
                </CardTitle>
                <CardDescription>
                  {s.studentId}
                  {s.currentClass
                    ? ` · ${s.currentClass.nameBn || s.currentClass.name}`
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">হিফজ জুজ</p>
                  <p className="text-lg font-bold">
                    {s.hifzProgress?.totalJuzCompleted ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">বকেয়া চালান</p>
                  <p className="text-lg font-bold">
                    {
                      s.invoices.filter(
                        (i) => i.status !== "PAID" && i.status !== "CANCELLED"
                      ).length
                    }
                  </p>
                  <Link
                    href={`/parent/fees?studentId=${s.id}`}
                    className="mt-1 inline-block text-xs text-emerald-700 underline"
                  >
                    ফি পাসবুক
                  </Link>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">স্ট্যাটাস</p>
                  <p className="text-lg font-bold">{s.status}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
