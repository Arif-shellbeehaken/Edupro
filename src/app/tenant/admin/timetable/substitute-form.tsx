"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  assignSubstituteAction,
  type SubState,
} from "@/application/use-cases/timetable/substitute";
import { Button } from "@/components/ui/button";

const inputClass =
  "flex h-10 w-full rounded-lg border px-3 text-sm";

export function SubstituteForm() {
  const [state, action, pending] = useActionState(
    assignSubstituteAction,
    {} as SubState
  );

  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input name="slotId" placeholder="Slot ID (ঐচ্ছিক)" className={inputClass} />
      <input name="teacherId" required placeholder="নতুন teacherId *" className={inputClass} />
      <input name="classId" placeholder="classId" className={inputClass} />
      <input name="dayOfWeek" type="number" min={0} max={6} placeholder="day 0–6" className={inputClass} />
      <input name="periodNo" type="number" min={1} placeholder="period" className={inputClass} />
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সাবস্টিটিউট অ্যাসাইন"}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600 sm:col-span-2">{state.message}</p>
      )}
    </form>
  );
}
