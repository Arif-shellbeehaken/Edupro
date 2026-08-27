"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  generateMonthlyFeesAction,
  type MonthlyFeeState,
} from "@/application/use-cases/finance/monthly-fees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm";

export function MonthlyFeeForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    generateMonthlyFeesAction,
    {} as MonthlyFeeState
  );
  const now = new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">মাসিক ফি অটো-জেনারেট · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-3">
          <input
            name="amount"
            type="number"
            min={1}
            required
            placeholder="পরিমাণ ৳ *"
            className={inputClass}
          />
          <input
            name="month"
            type="number"
            min={1}
            max={12}
            defaultValue={now.getMonth() + 1}
            className={inputClass}
          />
          <input
            name="year"
            type="number"
            defaultValue={now.getFullYear()}
            className={inputClass}
          />
          <select name="classId" className={inputClass} defaultValue="">
            <option value="">সব ক্লাস</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="dueDay"
            type="number"
            min={1}
            max={28}
            defaultValue={10}
            placeholder="ডিউ দিন"
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify" defaultChecked />
            অভিভাবক SMS
          </label>
          <Button type="submit" disabled={pending} className="sm:col-span-3">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "মাসিক চালান তৈরি"}
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
