"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyOverdueBooksAction,
  type OpsState,
} from "@/application/use-cases/operations/actions";
import { Button } from "@/components/ui/button";

export function OverdueNotifyButton({ count }: { count: number }) {
  const [state, action, pending] = useActionState(
    notifyOverdueBooksAction,
    {} as OpsState
  );

  return (
    <form action={action} className="space-y-2">
      <Button type="submit" size="sm" disabled={pending || count === 0}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `ওভারডিউ SMS (${count})`
        )}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
    </form>
  );
}
