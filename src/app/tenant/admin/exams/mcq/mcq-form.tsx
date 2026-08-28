"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  submitMcqAction,
  type McqState,
} from "@/application/use-cases/exam/mcq";
import { Button } from "@/components/ui/button";

const inputClass =
  "flex h-10 w-full rounded-lg border px-3 text-sm";

export function McqForm({
  subject,
  questions,
}: {
  subject: string;
  questions: { id: string; text: string; options: string[]; marks: number }[];
}) {
  const [state, action, pending] = useActionState(
    submitMcqAction,
    {} as McqState
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="subject" value={subject} />
      <div>
        <label className="text-xs font-medium">Student ID</label>
        <input name="studentId" required className={inputClass} placeholder="e.g. STU-001" />
      </div>
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">
            {i + 1}. {q.text}{" "}
            <span className="text-xs text-muted-foreground">({q.marks} নম্বর)</span>
          </p>
          {q.options.length > 0 ? (
            <div className="space-y-1">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input type="radio" name={`q_${q.id}`} value={opt} required />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              name={`q_${q.id}`}
              className={inputClass}
              placeholder="উত্তর"
              required
            />
          )}
        </div>
      ))}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-700 font-medium">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "জমা ও অটো-গ্রেড"}
      </Button>
    </form>
  );
}
