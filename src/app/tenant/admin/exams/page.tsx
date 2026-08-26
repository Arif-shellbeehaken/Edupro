import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";
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
import Link from "next/link";
import { ExamForms } from "./exam-forms";

const typeLabel: Record<string, string> = {
  CLASS_TEST: "ক্লাস টেস্ট",
  MID_TERM: "মিড টার্ম",
  FINAL: "ফাইনাল",
  BOARD: "বোর্ড",
  HIFZ_TEST: "হিফজ টেস্ট",
};

export default async function ExamsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let exams: Awaited<ReturnType<typeof examRepository.listExams>> = [];
  let subjects: Awaited<ReturnType<typeof examRepository.listSubjects>> = [];
  let students: { id: string; name: string; studentId: string }[] = [];

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
      exams = await examRepository.listExams();
      subjects = await examRepository.listSubjects();
      const s = await studentRepository.list({ status: "ACTIVE", take: 100 });
      students = s.map((x) => ({
        id: x.id,
        name: x.nameBn || x.name,
        studentId: x.studentId,
      }));
    } catch {
      // db
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="পরীক্ষা ও ফলাফল"
          subtitle="Exam · Marks · Grade"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">পরীক্ষা</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{exams.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">বিষয়</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subjects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মার্ক এন্ট্রি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {exams.reduce((s, e) => s + e._count.marks, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <ExamForms
            exams={exams.map((e) => ({
              id: e.id,
              name: e.nameBn || e.name,
              type: e.examType,
            }))}
            subjects={subjects.map((s) => ({
              id: s.id,
              name: s.nameBn || s.name,
              fullMarks: s.fullMarks,
            }))}
            students={students}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                পরীক্ষার তালিকা
              </CardTitle>
              <CardDescription>তৈরি করা পরীক্ষা ও মার্ক কাউন্ট</CardDescription>
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <p className="text-sm text-muted-foreground">এখনো কোনো পরীক্ষা নেই</p>
              ) : (
                <div className="space-y-3">
                  {exams.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{e.nameBn || e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeLabel[e.examType] ?? e.examType} · {e._count.marks} মার্ক
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tenant/admin/exams/marksheet?examId=${e.id}`}
                          className="text-xs text-primary underline"
                        >
                          মার্কশিট / GPA
                        </Link>
                        <Badge variant={e.isPublished ? "success" : "secondary"}>
                          {e.isPublished ? "প্রকাশিত" : "ড্রাফট"}
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
