"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  upsertTimetableSlotAction,
  type UpsertSlotState,
} from "@/application/use-cases/timetable/upsert-slot";
import { DAY_NAMES_BN } from "@/infrastructure/database/repositories/timetable-repository";

const initial: UpsertSlotState = {};
const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function TimetableForm({
  subjects,
}: {
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    upsertTimetableSlotAction,
    initial
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">দিন *</label>
        <select name="dayOfWeek" required className={inputClass} defaultValue="0">
          {DAY_NAMES_BN.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">পিরিয়ড নং *</label>
        <input
          name="periodNo"
          type="number"
          min={1}
          max={12}
          required
          defaultValue={1}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">শুরু *</label>
          <input name="startTime" type="time" required defaultValue="09:00" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">শেষ *</label>
          <input name="endTime" type="time" required defaultValue="09:45" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">বিষয়</label>
        <select name="subjectId" className={inputClass} defaultValue="">
          <option value="">— ঐচ্ছিক —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">রুম</label>
        <input name="room" placeholder="Room 101" className={inputClass} />
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">স্লট সংরক্ষিত</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সংরক্ষণ"}
      </Button>
    </form>
  );
}
