"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyGrievanceSlaOverdueAction,
  type ExtState,
} from "@/application/use-cases/donations/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GrievanceSlaForm() {
  const [state, action, pending] = useActionState(
    notifyGrievanceSlaOverdueAction,
    {} as ExtState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SLA ওভারডিউ · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            দিন
            <input
              name="days"
              type="number"
              defaultValue={3}
              min={1}
              max={30}
              className="ml-2 h-9 w-16 rounded-md border px-2 text-sm"
            />
          </label>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SLA SMS"}
          </Button>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state.success && (
            <p className="text-xs text-emerald-600">{state.message || "পাঠানো হয়েছে"}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
