"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyExamResultsAction,
  type NotifyResultsState,
} from "@/application/use-cases/exam/notify-results";
import { Button } from "@/components/ui/button";

export function ExamResultNotifyForm({
  exams,
}: {
  exams: { id: string; name: string; nameBn: string | null }[];
}) {
  const [state, action, pending] = useActionState(
    notifyExamResultsAction,
    {} as NotifyResultsState
  );

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">পরীক্ষা</span>
        <select
          name="examId"
          required
          className="h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">বাছুন…</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nameBn || e.name}
            </option>
          ))}
        </select>
      </label>
      <textarea
        name="body"
        placeholder="কাস্টম মেসেজ (খালি = নাম, নম্বর, %, গ্রেড সহ ডিফল্ট)"
        className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}
      <Button type="submit" disabled={pending || exams.length === 0}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ফলাফল প্রকাশ + SMS"}
      </Button>
    </form>
  );
}
