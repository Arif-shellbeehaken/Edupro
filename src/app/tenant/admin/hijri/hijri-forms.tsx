"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createHijriHolidayAction,
  seedDefaultHijriHolidaysAction,
  type HijriState,
} from "@/application/use-cases/hijri/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HijriForms() {
  const [createState, createAction, createPending] = useActionState(
    createHijriHolidayAction,
    {} as HijriState
  );
  const [seedState, seedAction, seedPending] = useActionState(
    seedDefaultHijriHolidaysAction,
    {} as HijriState
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন ছুটি</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="space-y-2">
            <input name="title" required placeholder="Title *" className={inputClass} />
            <input name="titleBn" placeholder="বাংলা নাম" className={inputClass} />
            <input name="hijriDate" required placeholder="হিজরি তারিখ (1 Ramadan) *" className={inputClass} />
            <input name="gregorianDate" type="date" className={inputClass} />
            <select name="holidayType" className={inputClass} defaultValue="RELIGIOUS">
              <option value="RELIGIOUS">ধর্মীয়</option>
              <option value="NATIONAL">জাতীয়</option>
              <option value="INSTITUTION">প্রতিষ্ঠান</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isRecurring" defaultChecked className="rounded" />
              প্রতি বছর পুনরাবৃত্ত
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="announce" />
              সবাইকে ঘোষণা SMS
            </label>
            {createState.error && <p className="text-xs text-red-600">{createState.error}</p>}
            {createState.success && <p className="text-xs text-emerald-600">যোগ হয়েছে</p>}
            <Button type="submit" disabled={createPending}>
              {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "যোগ করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ডিফল্ট ইসলামিক ছুটি</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            নববর্ষ, আশুরা, মিলাদুন্নবী, রমজান, কদর, ঈদুল ফিতর, আরাফা, ঈদুল আজহা
          </p>
          <form action={seedAction}>
            <Button type="submit" variant="outline" disabled={seedPending}>
              {seedPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সিড করুন"}
            </Button>
          </form>
          {seedState.success && (
            <p className="text-xs text-emerald-600">ডিফল্ট ছুটি · ঘোষণা SMS হয়েছে</p>
          )}
          {seedState.error && <p className="text-xs text-red-600">{seedState.error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
