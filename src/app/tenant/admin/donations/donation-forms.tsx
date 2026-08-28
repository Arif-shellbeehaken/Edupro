"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createDonationAction,
  launchDonationCampaignAction,
  type ExtState,
} from "@/application/use-cases/donations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DonationForms() {
  const [state, action, pending] = useActionState(
    createDonationAction,
    {} as ExtState
  );
  const [campState, campAction, campPending] = useActionState(
    launchDonationCampaignAction,
    {} as ExtState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন অনুদান / যাকাত · SMS রসিদ</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-2 sm:grid-cols-2">
            <input
              name="donorName"
              required
              placeholder="দাতার নাম *"
              className={inputClass}
            />
            <input name="donorPhone" placeholder="ফোন" className={inputClass} />
            <input
              name="amount"
              type="number"
              min={1}
              required
              placeholder="পরিমাণ (৳) *"
              className={inputClass}
            />
            <select name="category" className={inputClass} defaultValue="ZAKAT">
              <option value="ZAKAT">যাকাত</option>
              <option value="SADAQAH">সদকা</option>
              <option value="GENERAL">সাধারণ</option>
              <option value="SPONSORSHIP">স্পন্সরশিপ</option>
              <option value="WAQF">ওয়াকফ</option>
            </select>
            <select name="method" className={inputClass} defaultValue="CASH">
              <option value="CASH">নগদ</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK">ব্যাংক</option>
            </select>
            <input name="notes" placeholder="নোট" className={inputClass} />
            <div className="sm:col-span-2">
              {state.error && (
                <p className="mb-2 text-xs text-red-600">{state.error}</p>
              )}
              {state.success && (
                <p className="mb-2 text-xs text-emerald-600">{state.message}</p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "রসিদ তৈরি"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">দান ক্যাম্পেইন · SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={campAction} className="grid gap-2">
            <input
              name="title"
              required
              placeholder="ক্যাম্পেইন শিরোনাম *"
              className={inputClass}
            />
            <select name="category" className={inputClass} defaultValue="ZAKAT">
              <option value="ZAKAT">যাকাত</option>
              <option value="SADAQAH">সদকা</option>
              <option value="GENERAL">সাধারণ</option>
              <option value="SPONSORSHIP">স্পন্সরশিপ</option>
              <option value="WAQF">ওয়াকফ</option>
            </select>
            <select name="audience" className={inputClass} defaultValue="PARENTS">
              <option value="PARENTS">অভিভাবক</option>
              <option value="STAFF">স্টাফ</option>
              <option value="BOTH">উভয়</option>
            </select>
            <textarea
              name="message"
              required
              placeholder="বার্তা *"
              className="min-h-[72px] rounded-lg border border-border px-3 py-2 text-sm"
            />
            {campState.error && (
              <p className="text-xs text-red-600">{campState.error}</p>
            )}
            {campState.success && (
              <p className="text-xs text-emerald-600">{campState.message}</p>
            )}
            <Button type="submit" disabled={campPending}>
              {campPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ক্যাম্পেইন SMS"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
