"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  publishDayTimetableAction,
  type PublishDayState,
} from "@/application/use-cases/timetable/publish-day";
import { DAY_NAMES_BN } from "@/infrastructure/database/repositories/timetable-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm";

export function PublishDayForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    publishDayTimetableAction,
    {} as PublishDayState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">দিনভিত্তিক রুটিন পরিবর্তন · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-wrap items-end gap-2">
          <select name="dayOfWeek" className={inputClass} defaultValue="0">
            {DAY_NAMES_BN.map((name, i) => (
              <option key={i} value={i}>
                {name}
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
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "রুটিন SMS"}
          </Button>
          {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
          {state.success && (
            <p className="w-full text-xs text-emerald-600">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
