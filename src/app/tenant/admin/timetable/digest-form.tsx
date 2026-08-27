"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  sendTimetableDigestAction,
  type DigestState,
} from "@/application/use-cases/timetable/weekly-digest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TimetableDigestForm({
  classes,
}: {
  classes: { id: string; name: string; nameBn: string | null }[];
}) {
  const [state, action, pending] = useActionState(
    sendTimetableDigestAction,
    {} as DigestState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">সাপ্তাহিক রুটিন SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-wrap items-end gap-2">
          <select
            name="classId"
            className="h-9 rounded-md border px-2 text-sm"
            defaultValue=""
          >
            <option value="">সব ক্লাস</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameBn || c.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ডাইজেস্ট পাঠান"}
          </Button>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state.success && (
            <p className="text-xs text-emerald-600">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
