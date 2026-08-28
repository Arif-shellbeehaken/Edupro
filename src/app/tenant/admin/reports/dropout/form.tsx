"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  computeDropoutRiskAction,
  type RiskState,
} from "@/application/use-cases/reports/dropout-risk";

export function DropoutForm() {
  const [state, action, pending] = useActionState(
    computeDropoutRiskAction,
    {} as RiskState
  );
  return (
    <form action={action}>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "ঝুঁকি হিসাব করুন"
        )}
      </Button>
      {state.message && (
        <p className="mt-2 text-sm text-emerald-600">{state.message}</p>
      )}
      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
