import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";

/**
 * Student Portal — homework list + basic profile for demo.
 * Production: link User ↔ Student record via student.userId.
 */
export default async function StudentPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return (
      <div className="p-8 text-center">
        <p>প্রতিষ্ঠান লিংক নেই</p>
        <Button className="mt-4" asChild><Link href="/login">লগইন</Link></Button>
      </div>
    );
  }

  let homework: Awaited<ReturnType<typeof extendedRepository.listHomework>> = [];
  try {
    homework = await extendedRepository.listHomework(tenantId);
  } catch { /* */ }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nameBn: true, name: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-emerald-800">শিক্ষার্থী পোর্টাল</h1>
            <p className="text-xs text-muted-foreground">
              {tenant?.nameBn || tenant?.name} · {session.user.name}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">লগআউট</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>হোমওয়ার্ক / অ্যাসাইনমেন্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {homework.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো অ্যাসাইনমেন্ট নেই</p>
            ) : (
              homework.map((h) => (
                <div key={h.id} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.subjectName || "—"}
                    {h.dueDate ? ` · ডিউ ${h.dueDate.toLocaleDateString("bn-BD")}` : ""}
                  </p>
                  {h.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{h.description}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
