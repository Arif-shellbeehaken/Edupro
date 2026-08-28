import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { createQuestionAction } from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default async function QuestionsPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listQuestions>> = [];
  try {
    rows = await extendedOpsRepository.listQuestions();
  } catch {
    /* empty */
  }

  return (
    <div className="page-pad">
      <div>
        <h1 className="text-2xl font-semibold">প্রশ্নব্যাংক</h1>
        <p className="text-sm text-muted-foreground">MCQ · সংক্ষিপ্ত · রচনা</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন প্রশ্ন · স্টাফ SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createQuestionAction} className="grid gap-3 sm:grid-cols-2">
            <input
              name="subject"
              required
              placeholder="বিষয় *"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="className"
              placeholder="ক্লাস"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="questionType"
              defaultValue="MCQ"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="MCQ">MCQ</option>
              <option value="SHORT">সংক্ষিপ্ত</option>
              <option value="ESSAY">রচনা</option>
            </select>
            <select
              name="difficulty"
              defaultValue="MEDIUM"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="EASY">সহজ</option>
              <option value="MEDIUM">মাঝারি</option>
              <option value="HARD">কঠিন</option>
            </select>
            <textarea
              name="questionText"
              required
              placeholder="প্রশ্ন *"
              rows={3}
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="optionsJson"
              placeholder='MCQ অপশন JSON: ["ক","খ","গ","ঘ"]'
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="correctAnswer"
              placeholder="সঠিক উত্তর"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="marks"
              type="number"
              defaultValue={1}
              placeholder="মান"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="sendSms" />
              স্টাফকে নোটিশ SMS
            </label>
            <Button type="submit">যোগ করুন</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.length === 0 ? (
        <EmptyState title="কোনো প্রশ্ন নেই" />
      ) : rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{r.subject}</Badge>
                <Badge>{r.questionType}</Badge>
                <Badge variant="outline">{r.difficulty}</Badge>
                <span className="text-xs text-muted-foreground">{r.marks} নম্বর</span>
              </div>
              <p className="mt-2 text-sm">{r.questionText}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
