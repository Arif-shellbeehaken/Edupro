"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createInvoiceAction,
  type CreateInvoiceState,
} from "@/application/use-cases/finance/create-invoice";

const initial: CreateInvoiceState = {};
const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type StudentOpt = { id: string; name: string; studentId: string };

export function CreateInvoiceForm({ students }: { students: StudentOpt[] }) {
  const [state, formAction, pending] = useActionState(createInvoiceAction, initial);

  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="studentId">
          শিক্ষার্থী *
        </label>
        <select id="studentId" name="studentId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            সিলেক্ট করুন
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.studentId})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="totalAmount">
            পরিমাণ (৳) *
          </label>
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            min={1}
            required
            className={inputClass}
            placeholder="5000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="dueDate">
            শেষ তারিখ *
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={defaultDue.toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="notes">
          নোট
        </label>
        <input id="notes" name="notes" className={inputClass} placeholder="মাসিক টিউশন..." />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="notify" defaultChecked />
        অভিভাবককে চালান SMS
      </label>
      {state.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message || `চালান ${state.invoiceNumber} তৈরি হয়েছে`}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending || students.length === 0}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            তৈরি হচ্ছে...
          </>
        ) : (
          "চালান তৈরি করুন"
        )}
      </Button>
    </form>
  );
}
