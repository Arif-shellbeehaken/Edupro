"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createBookAction,
  issueBookAction,
  returnBookAction,
  type OpsState,
} from "@/application/use-cases/operations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function LibraryForms({
  books,
  students,
  issues,
}: {
  books: { id: string; title: string; available: number }[];
  students: { id: string; name: string; studentId: string }[];
  issues: { id: string; bookTitle: string; dueDate: string }[];
}) {
  const [addState, addAction, addPending] = useActionState(createBookAction, {} as OpsState);
  const [issueState, issueAction, issuePending] = useActionState(issueBookAction, {} as OpsState);
  const [retState, retAction, retPending] = useActionState(returnBookAction, {} as OpsState);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন বই</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="space-y-2">
            <input name="title" required placeholder="শিরোনাম *" className={inputClass} />
            <input name="titleBn" placeholder="বাংলা নাম" className={inputClass} />
            <input name="author" placeholder="লেখক" className={inputClass} />
            <input name="category" placeholder="ক্যাটাগরি" className={inputClass} />
            <input name="totalCopies" type="number" min={1} defaultValue={1} className={inputClass} />
            <input name="shelfLocation" placeholder="শেলফ" className={inputClass} />
            {addState.error && <p className="text-xs text-red-600">{addState.error}</p>}
            {addState.success && <p className="text-xs text-emerald-600">বই যোগ হয়েছে</p>}
            <Button type="submit" className="w-full" disabled={addPending}>
              {addPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "যোগ করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">বই ইস্যু</CardTitle>
          <CardDescription>ডিফল্ট ১৪ দিন</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={issueAction} className="space-y-2">
            <select name="bookId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                বই *
              </option>
              {books
                .filter((b) => b.available > 0)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.available})
                  </option>
                ))}
            </select>
            <select name="studentId" className={inputClass} defaultValue="">
              <option value="">শিক্ষার্থী (ঐচ্ছিক)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
            <input name="days" type="number" min={1} defaultValue={14} className={inputClass} />
            {issueState.error && <p className="text-xs text-red-600">{issueState.error}</p>}
            {issueState.success && (
              <p className="text-xs text-emerald-600">{issueState.message}</p>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notify" defaultChecked />
              অভিভাবককে ইস্যু SMS
            </label>
            <Button type="submit" className="w-full" disabled={issuePending}>
              {issuePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ইস্যু"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">রিটার্ন</CardTitle>
          <CardDescription>লেট হলে জরিমানা ৳১০/দিন</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">কোনো চলমান ইস্যু নেই</p>
          ) : (
            issues.map((i) => (
              <form key={i.id} action={retAction} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <div className="text-sm">
                  <p className="font-medium">{i.bookTitle}</p>
                  <p className="text-xs text-muted-foreground">ডিউ {i.dueDate}</p>
                </div>
                <input type="hidden" name="issueId" value={i.id} />
                <Button type="submit" size="sm" variant="outline" disabled={retPending}>
                  রিটার্ন
                </Button>
              </form>
            ))
          )}
          {retState.error && <p className="text-xs text-red-600">{retState.error}</p>}
          {retState.success && (
            <p className="text-xs text-emerald-600">{retState.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
