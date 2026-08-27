"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  publishExamSeatingAction,
  type SeatingState,
} from "@/application/use-cases/exam/seating-plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm";

export function ExamSeatingForm({
  exams,
  classes,
}: {
  exams: { id: string; name: string; nameBn: string | null }[];
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    publishExamSeatingAction,
    {} as SeatingState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">সীট প্ল্যান · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <select name="examId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              পরীক্ষা *
            </option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nameBn || e.name}
              </option>
            ))}
          </select>
          <select name="classId" className={inputClass} defaultValue="">
            <option value="">সব ক্লাস</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="rooms"
            defaultValue="Hall-A:40,Hall-B:40"
            placeholder="রুম:ক্যাপাসিটি,..."
            className={inputClass + " sm:col-span-2"}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify" defaultChecked />
            অভিভাবককে সীট SMS
          </label>
          <Button type="submit" disabled={pending || exams.length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সীট প্ল্যান প্রকাশ"}
          </Button>
          {state.error && (
            <p className="text-xs text-red-600 sm:col-span-2">{state.error}</p>
          )}
          {state.success && (
            <p className="text-xs text-emerald-600 sm:col-span-2">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
