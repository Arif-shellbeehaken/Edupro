import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { computeGpa, letterGrade } from "@/lib/grading";
import { PrintButton } from "./print-button";
import { Badge } from "@/components/ui/badge";

export default async function MarksheetPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; studentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;
  const examId = sp.examId;
  if (!examId) redirect("/tenant/admin/exams");

  let tenantName = "প্রতিষ্ঠান";
  let tenantNameBn = "";
  let exam: Awaited<ReturnType<typeof examRepository.getExam>> = null;
  let grouped = new Map<string, Awaited<ReturnType<typeof examRepository.listMarksForExam>>>();
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
      if (tenant) {
        tenantName = tenant.name;
        tenantNameBn = tenant.nameBn || "";
      }
      exam = await examRepository.getExam(examId);
      grouped = await examRepository.listMarksGroupedByStudent(examId);
      students = await studentRepository.list({ status: "ACTIVE", take: 300 });
    } catch {
      // db
    }
  }

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const filterId = sp.studentId;
  const entries = [...grouped.entries()].filter(([sid]) => !filterId || sid === filterId);

  // rank by GPA
  const ranked = entries
    .map(([sid, marks]) => {
      const g = computeGpa(
        marks.map((m) => ({
          obtained: m.marksObtained,
          full: m.fullMarks,
          grade: m.grade,
        }))
      );
      return { sid, marks, ...g };
    })
    .sort((a, b) => b.gpa - a.gpa);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">মার্কশিট / GPA</h1>
          <p className="text-sm text-muted-foreground">
            {exam?.nameBn || exam?.name || "পরীক্ষা"} · {ranked.length} জন
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tenant/admin/exams" className="text-sm underline">
            পরীক্ষা তালিকা
          </Link>
          <PrintButton />
        </div>
      </div>

      {ranked.length === 0 && (
        <p className="text-sm text-muted-foreground">এই পরীক্ষায় কোনো মার্ক নেই</p>
      )}

      {ranked.map((row, idx) => {
        const st = studentMap.get(row.sid);
        return (
          <div
            key={row.sid}
            className="break-inside-avoid rounded-lg border border-border bg-card p-6 print:border-black"
          >
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
              {tenantNameBn || tenantName}
            </p>
            <h2 className="mt-1 text-center text-xl font-medium">
              {exam?.nameBn || exam?.name}
            </h2>
            <p className="text-center text-sm text-muted-foreground">মার্কশিট / Result Card</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p>
                নাম:{" "}
                <span className="font-medium">{st?.nameBn || st?.name || row.sid}</span>
              </p>
              <p>
                আইডি:{" "}
                <span className="font-medium tabular-nums">{st?.studentId || "—"}</span>
              </p>
              <p>পিতা: {st?.fatherName || "—"}</p>
              <p>
                পজিশন: <span className="font-medium">{idx + 1}</span>
              </p>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2">বিষয়</th>
                  <th className="py-2">প্রাপ্ত</th>
                  <th className="py-2">পূর্ণমান</th>
                  <th className="py-2">গ্রেড</th>
                </tr>
              </thead>
              <tbody>
                {row.marks.map((m) => (
                  <tr key={m.id} className="border-b border-border/60">
                    <td className="py-2">{m.subject.nameBn || m.subject.name}</td>
                    <td className="py-2 tabular-nums">{m.marksObtained}</td>
                    <td className="py-2 tabular-nums">{m.fullMarks}</td>
                    <td className="py-2">
                      {m.grade || letterGrade(m.marksObtained, m.fullMarks)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span>
                মোট {row.totalObtained}/{row.totalFull}
              </span>
              <Badge>GPA {row.gpa.toFixed(2)}</Badge>
              <Badge variant="secondary">গ্রেড {row.letter}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
