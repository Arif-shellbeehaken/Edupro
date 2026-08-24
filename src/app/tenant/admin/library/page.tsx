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
import { LibraryForms } from "./library-forms";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let books: Awaited<ReturnType<typeof operationsRepository.listBooks>> = [];
  let issues: Awaited<ReturnType<typeof operationsRepository.listActiveIssues>> = [];
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
                <p className="text-sm text-muted-foreground">কোনো বই নেই</p>
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
