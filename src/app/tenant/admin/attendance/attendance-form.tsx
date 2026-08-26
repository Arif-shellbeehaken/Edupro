"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markAttendanceAction,
  type MarkAttendanceState,
} from "@/application/use-cases/attendance/mark";

const initial: MarkAttendanceState = {};

type StudentRow = { id: string; name: string; studentId: string };

export function AttendanceForm({
  students,
  defaultDate,
}: {
  students: StudentRow[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(markAttendanceAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="date">
            তারিখ
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className="flex h-10 rounded-lg border border-zinc-200 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="notifyAbsent" />
          অনুপস্থিতদের অভিভাবককে SMS
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              সংরক্ষণ...
            </>
          ) : (
            "উপস্থিতি সংরক্ষণ"
          )}
        </Button>
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message || `${state.count} জনের উপস্থিতি সংরক্ষিত হয়েছে`}
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {students.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.studentId}</p>
            </div>
            <select
              name={`status__${s.id}`}
              defaultValue="PRESENT"
              className="h-9 rounded-lg border border-zinc-200 bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="PRESENT">উপস্থিত</option>
              <option value="ABSENT">অনুপস্থিত</option>
              <option value="LATE">লেট</option>
              <option value="HALF_DAY">হাফ ডে</option>
              <option value="LEAVE">ছুটি</option>
            </select>
          </div>
        ))}
      </div>
    </form>
  );
}
