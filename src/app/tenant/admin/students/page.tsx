import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Plus, BookOpen } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
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
import { Button } from "@/components/ui/button";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.tenantId && !session.user.isSuperAdmin) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let students: Awaited<ReturnType<typeof studentRepository.list>> = [];

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
      students = await studentRepository.list({ take: 100 });
    } catch {
      students = [];
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="শিক্ষার্থী (SIS)"
          subtitle={`${students.length} জন সক্রিয়`}
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tenant/admin/students/id-cards"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              আইডি কার্ড প্রিন্ট
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">স্টুডেন্ট ইনফরমেশন সিস্টেম</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/tenant/admin/students/import">CSV ইমপোর্ট</Link>
              </Button>
              <Button asChild>
                <Link href="/tenant/admin/students/new">
                  <Plus className="h-4 w-4" />
                  নতুন শিক্ষার্থী
                </Link>
              </Button>
            </div>
          </div>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                শিক্ষার্থী তালিকা
              </CardTitle>
              <CardDescription>নাম, আইডি, ক্লাস, হিফজ স্ট্যাটাস</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                  <p>কোনো শিক্ষার্থী নেই</p>
                  <Button className="mt-4" asChild>
                    <Link href="/tenant/admin/students/new">প্রথম শিক্ষার্থী যোগ করুন</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40">
                          {(s.nameBn || s.name).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.nameBn || s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.studentId}
                            {s.currentClass
                              ? ` · ${s.currentClass.nameBn || s.currentClass.name}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.isHifzStudent && (
                          <Badge variant="success" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            হিফজ
                          </Badge>
                        )}
                        <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>
                          {s.status === "ACTIVE" ? "সক্রিয়" : s.status}
                        </Badge>
                      </div>
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
