import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { McqForm } from "./mcq-form";

export default async function McqExamPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tid = session.user.tenantId;
  const sp = await searchParams;
  const subject = (sp.subject || "").trim();

  const subjects = await prisma.questionBankItem.findMany({
    where: { tenantId: tid, questionType: "MCQ" },
    distinct: ["subject"],
    select: { subject: true },
  });

  const questions = subject
    ? await prisma.questionBankItem.findMany({
        where: { tenantId: tid, subject, questionType: "MCQ" },
        take: 40,
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <AppHeader
        title="অনলাইন MCQ"
        subtitle="অটো-গ্রেডিং · Question bank থেকে"
        userName={session.user.name ?? "Admin"}
        userRole={session.user.role}
      />
      <div className="page-pad">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">বিষয় নির্বাচন</CardTitle>
            <CardDescription>
              {subjects.length} বিষয়ে MCQ আছে ·{" "}
              <a href="/tenant/admin/questions" className="underline">
                প্রশ্নব্যাংক
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <a
                key={s.subject}
                href={`/tenant/admin/exams/mcq?subject=${encodeURIComponent(s.subject)}`}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  subject === s.subject
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "hover:bg-muted"
                }`}
              >
                {s.subject}
              </a>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                প্রথমে Questions মডিউলে MCQ যোগ করুন
              </p>
            )}
          </CardContent>
        </Card>

        {subject && questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{subject} · {questions.length} প্রশ্ন</CardTitle>
            </CardHeader>
            <CardContent>
              <McqForm
                subject={subject}
                questions={questions.map((q) => ({
                  id: q.id,
                  text: q.questionText,
                  options: (() => {
                    try {
                      return q.optionsJson
                        ? (JSON.parse(q.optionsJson) as string[])
                        : [];
                    } catch {
                      return [] as string[];
                    }
                  })(),
                  marks: q.marks,
                }))}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
