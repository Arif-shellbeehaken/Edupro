import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
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
import { LibraryForms } from "./library-forms";
import { OverdueNotifyButton } from "./overdue-notify";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let books: Awaited<ReturnType<typeof operationsRepository.listBooks>> = [];
  let issues: Awaited<ReturnType<typeof operationsRepository.listActiveIssues>> = [];
  let overdue: Awaited<ReturnType<typeof operationsRepository.listOverdueIssues>> = [];
  let students: { id: string; name: string; studentId: string }[] = [];

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
      books = await operationsRepository.listBooks();
      issues = await operationsRepository.listActiveIssues();
      overdue = await operationsRepository.listOverdueIssues();
      const s = await studentRepository.list({ status: "ACTIVE", take: 100 });
      students = s.map((x) => ({
        id: x.id,
        name: x.nameBn || x.name,
        studentId: x.studentId,
      }));
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="লাইব্রেরি"
          subtitle="বই ক্যাটালগ · ইস্যু · রিটার্ন · জরিমানা"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মোট বই</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{books.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">উপলব্ধ কপি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {books.reduce((s, b) => s + b.availableCopies, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">ইস্যু চলমান</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{issues.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ওভারডিউ বই</CardTitle>
                <CardDescription>ডিউ পার হওয়া ইস্যু · অভিভাবক রিমাইন্ডার</CardDescription>
              </div>
              <OverdueNotifyButton count={overdue.length} />
            </CardHeader>
            <CardContent className="space-y-2">
              {overdue.length === 0 ? (
                <EmptyState title="কোনো ওভারডিউ নেই" description="সব ইস্যু সময়মতো আছে" />
              ) : (
                overdue.slice(0, 15).map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{o.book.titleBn || o.book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.student
                          ? `${o.student.name} (${o.student.code})`
                          : "—"}{" "}
                        · {o.daysLate} দিন দেরি
                      </p>
                    </div>
                    <Badge variant="destructive">{o.daysLate}d</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <LibraryForms
            books={books.map((b) => ({
              id: b.id,
              title: b.titleBn || b.title,
              available: b.availableCopies,
            }))}
            students={students}
            issues={issues.map((i) => ({
              id: i.id,
              bookTitle: i.book.titleBn || i.book.title,
              dueDate: i.dueDate.toISOString().slice(0, 10),
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                ক্যাটালগ
              </CardTitle>
              <CardDescription>সব বই</CardDescription>
            </CardHeader>
            <CardContent>
              {books.length === 0 ? (
                <EmptyState
                  title="কোনো বই নেই"
                  description="লাইব্রেরি ক্যাটালগে প্রথম বই যোগ করুন"
                />
              ) : (
                <div className="space-y-2">
                  {books.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.titleBn || b.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.author || "—"} · {b.category || "সাধারণ"} · শেলফ{" "}
                          {b.shelfLocation || "—"}
                        </p>
                      </div>
                      <Badge variant={b.availableCopies > 0 ? "success" : "secondary"}>
                        {b.availableCopies}/{b.totalCopies}
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
