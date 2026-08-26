"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyChronicAbsenteesAction,
  type NotifyChronicState,
} from "@/application/use-cases/attendance/notify-chronic";
import { Button } from "@/components/ui/button";

export function NotifyChronicForm({
  from,
  to,
  threshold,
  classId,
  flaggedCount,
}: {
  from: string;
  to: string;
  threshold: number;
  classId: string;
  flaggedCount: number;
}) {
  const [state, action, pending] = useActionState(
    notifyChronicAbsenteesAction,
    {} as NotifyChronicState
  );

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="threshold" value={threshold} />
      <input type="hidden" name="classId" value={classId} />
      <p className="text-sm font-medium">
        ফ্ল্যাগড {flaggedCount} জনের অভিভাবককে bulk SMS
      </p>
      <textarea
        name="body"
        placeholder="কাস্টম মেসেজ (খালি রাখলে ডিফল্ট সতর্কতা যাবে)"
        className="min-h-[72px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}
      <Button type="submit" disabled={pending || flaggedCount === 0} size="sm">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "সতর্কতা SMS পাঠান"
        )}
      </Button>
    </form>
  );
}
