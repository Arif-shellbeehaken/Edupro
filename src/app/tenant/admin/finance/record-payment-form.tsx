"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  recordPaymentAction,
  type RecordPaymentState,
} from "@/application/use-cases/finance/record-payment";

const initial: RecordPaymentState = {};
const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

type InvoiceOpt = {
  id: string;
  label: string;
  due: number;
};

export function RecordPaymentForm({ invoices }: { invoices: InvoiceOpt[] }) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, initial);
  const unpaid = invoices.filter((i) => i.due > 0);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invoiceId">
          চালান *
        </label>
        <select id="invoiceId" name="invoiceId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            সিলেক্ট করুন
          </option>
          {unpaid.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.label} (বাকি ৳{inv.due})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="amount">
            পরিমাণ (৳) *
          </label>
          <input id="amount" name="amount" type="number" min={1} required className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="method">
            মাধ্যম *
          </label>
          <select id="method" name="method" required className={inputClass} defaultValue="CASH">
            <option value="CASH">নগদ</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="ROCKET">Rocket</option>
            <option value="BANK">ব্যাংক</option>
            <option value="CARD">কার্ড</option>
            <option value="OTHER">অন্যান্য</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="transactionId">
          ট্রানজেকশন আইডি
        </label>
        <input id="transactionId" name="transactionId" className={inputClass} placeholder="bKash/Nagad TrxID" />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message || "পেমেন্ট সফলভাবে রেকর্ড হয়েছে"}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="notifyGuardian" defaultChecked />
        অভিভাবককে SMS রসিদ
      </label>
      <Button type="submit" className="w-full" disabled={pending || unpaid.length === 0}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            সংরক্ষণ...
          </>
        ) : (
          "পেমেন্ট রেকর্ড করুন"
        )}
      </Button>
    </form>
  );
}
