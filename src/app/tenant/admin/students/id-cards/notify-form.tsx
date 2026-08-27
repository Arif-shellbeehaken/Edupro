"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyIdCardsReadyAction,
  type IdCardState,
} from "@/application/use-cases/students/id-card-notify";
import { Button } from "@/components/ui/button";

export function IdCardNotifyForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    notifyIdCardsReadyAction,
    {} as IdCardState
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 print:hidden">
      <select name="classId" className="h-9 rounded-md border px-2 text-sm" defaultValue="">
        <option value="">সব ক্লাস</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "আইডি কার্ড SMS"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
    </form>
  );
}
