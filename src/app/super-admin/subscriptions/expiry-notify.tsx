"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyExpiringSubscriptionsAction,
  type SubState,
} from "@/application/use-cases/super-admin/subscription";
import { Button } from "@/components/ui/button";

export function ExpiryNotifyForm() {
  const [state, action, pending] = useActionState(
    notifyExpiringSubscriptionsAction,
    {} as SubState
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
      <label className="text-sm">
        দিন
        <input
          name="days"
          type="number"
          defaultValue={7}
          min={1}
          max={30}
          className="ml-2 h-9 w-16 rounded-md border px-2 text-sm"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "মেয়াদোত্তীর্ণ SMS"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
    </form>
  );
}
