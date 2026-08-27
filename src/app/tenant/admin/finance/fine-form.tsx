"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  applyOverdueFineAction,
  type FineState,
} from "@/application/use-cases/finance/apply-fine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverdueFineForm() {
  const [state, action, pending] = useActionState(
    applyOverdueFineAction,
    {} as FineState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ওভারডিউ জরিমানা · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-3">
          <input
            name="fineFlat"
            type="number"
            min={0}
            placeholder="ফিক্সড ৳"
            className="h-9 rounded-md border px-2 text-sm"
          />
          <input
            name="finePct"
            type="number"
            min={0}
            max={100}
            placeholder="% (বকেয়ার)"
            className="h-9 rounded-md border px-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify" defaultChecked />
            অভিভাবক SMS
          </label>
          <Button type="submit" disabled={pending} className="sm:col-span-3">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "জরিমানা প্রয়োগ"}
          </Button>
          {state.error && (
            <p className="text-xs text-red-600 sm:col-span-3">{state.error}</p>
          )}
          {state.success && (
            <p className="text-xs text-emerald-600 sm:col-span-3">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
