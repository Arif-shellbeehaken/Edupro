"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSupportTicketAction,
  type TicketState,
} from "@/application/use-cases/support/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function SupportTicketForm() {
  const [state, action, pending] = useActionState(
    createSupportTicketAction,
    {} as TicketState
  );

  return (
    <form action={action} className="max-w-lg space-y-3">
      <select name="category" className={inputClass} defaultValue="GENERAL">
        <option value="GENERAL">সাধারণ</option>
        <option value="BILLING">বিলিং</option>
        <option value="TECHNICAL">টেকনিক্যাল</option>
        <option value="ONBOARDING">অনবোর্ডিং</option>
      </select>
      <select name="priority" className={inputClass} defaultValue="MEDIUM">
        <option value="LOW">কম</option>
        <option value="MEDIUM">মাঝারি</option>
        <option value="HIGH">উচ্চ</option>
        <option value="URGENT">জরুরি</option>
      </select>
      <input name="subject" required placeholder="বিষয় *" className={inputClass} />
      <textarea
        name="description"
        required
        placeholder="বিস্তারিত *"
        className="min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "টিকিট পাঠান"}
      </Button>
    </form>
  );
}
