"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyLowStockAction,
  type ActionState,
} from "@/application/use-cases/crm/actions";
import { Button } from "@/components/ui/button";

export function LowStockNotifyButton({ count }: { count: number }) {
  const [state, action, pending] = useActionState(
    notifyLowStockAction,
    {} as ActionState
  );

  return (
    <form action={action} className="space-y-1">
      <Button type="submit" size="sm" variant="outline" disabled={pending || count === 0}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : `লো-স্টক SMS (${count})`}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
    </form>
  );
}
