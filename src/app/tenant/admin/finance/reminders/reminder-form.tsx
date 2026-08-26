"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  sendFeeRemindersAction,
  type FeeReminderState,
} from "@/application/use-cases/finance/fee-reminders";
import { Button } from "@/components/ui/button";

export function FeeReminderForm({ overdueCount }: { overdueCount: number }) {
  const [state, action, pending] = useActionState(
    sendFeeRemindersAction,
    {} as FeeReminderState
  );

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          কত দিন আগের due অন্তর্ভুক্ত করবেন
        </span>
        <select
          name="daysAhead"
          defaultValue="0"
          className="h-10 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="0">শুধু ওভারডিউ</option>
          <option value="3">আজ + আগামী ৩ দিন</option>
          <option value="7">আজ + আগামী ৭ দিন</option>
        </select>
      </label>
      <textarea
        name="body"
        placeholder="কাস্টম মেসেজ (খালি = ডিফল্ট বকেয়া রিমাইন্ডার)"
        className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}
      <Button type="submit" disabled={pending || overdueCount === 0}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `রিমাইন্ডার পাঠান (${overdueCount} চালান)`
        )}
      </Button>
    </form>
  );
}
