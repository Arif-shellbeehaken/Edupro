import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamResultNotifyForm } from "./notify-form";

export default async function ExamNotifyPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;

  let tenantName = "প্রতিষ্ঠান";
  let exams: { id: string; name: string; nameBn: string | null }[] = [];
  let preview: Awaited<
    ReturnType<typeof examRepository.studentResultsSummary>
  > = [];

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
      const list = await examRepository.listExams();
      exams = list.map((e) => ({
        id: e.id,
        name: e.name,
        nameBn: e.nameBn,
      }));
      const examId = sp.examId || exams[0]?.id;
      if (examId) {
        preview = await examRepository.studentResultsSummary(examId);
      }
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ফলাফল SMS"
          subtitle="পরীক্ষার সারাংশ অভিভাবককে"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/tenant/admin/exams" className="underline">
              পরীক্ষা
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/tenant/admin/exams/marksheet" className="underline">
              মার্কশিট
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bulk ফলাফল নোটিশ</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamResultNotifyForm exams={exams} />
            </CardContent>
          </Card>

          {preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>প্রিভিউ ({preview.length} জন)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2">নাম</th>
                        <th className="py-2">আইডি</th>
                        <th className="py-2">মোট</th>
                        <th className="py-2">%</th>
                        <th className="py-2">বিষয়</th>
                        <th className="py-2">ফোন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r) => (
                        <tr key={r.studentId} className="border-b border-border/60">
                          <td className="py-2 font-medium">{r.name}</td>
                          <td className="py-2 font-mono text-xs">{r.code}</td>
                          <td className="py-2 tabular-nums">
                            {r.obtained}/{r.full}
                          </td>
                          <td className="py-2 tabular-nums">{r.pct}%</td>
                          <td className="py-2">{r.subjects}</td>
                          <td className="py-2 text-xs">{r.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
