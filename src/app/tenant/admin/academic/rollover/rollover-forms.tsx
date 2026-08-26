"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  createYearAction,
  rolloverAction,
  type RolloverState,
} from "@/application/use-cases/academic/rollover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type YearRow = {
  id: string;
  name: string;
  nameBn: string | null;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  classCount: number;
  studentCount: number;
};

export function RolloverForms({ years }: { years: YearRow[] }) {
  const [createState, createAction, createPending] = useActionState(
    createYearAction,
    {} as RolloverState
  );
  const [rollState, rollAction, rollPending] = useActionState(
    rolloverAction,
    {} as RolloverState
  );

  const current = years.find((y) => y.isCurrent) ?? years[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>একাডেমিক সেশনসমূহ</CardTitle>
          <CardDescription>বর্তমান সেশন হাইলাইট করা</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {years.length === 0 && (
            <p className="text-sm text-muted-foreground">এখনো কোনো সেশন নেই</p>
          )}
          {years.map((y) => (
            <div
              key={y.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {y.nameBn || y.name}{" "}
                  {y.isCurrent && <Badge variant="success">বর্তমান</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {y.startDate} → {y.endDate} · ক্লাস {y.classCount} · শিক্ষার্থী{" "}
                  {y.studentCount}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>নতুন সেশন তৈরি</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="2026-2027 *"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              name="nameBn"
              placeholder="বাংলা নাম"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">শুরু</span>
              <input
                type="date"
                name="startDate"
                required
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">শেষ</span>
              <input
                type="date"
                name="endDate"
                required
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="setCurrent" />
              তৈরির পর বর্তমান সেশন হিসেবে সেট করুন
            </label>
            {createState.error && (
              <p className="text-sm text-red-600 sm:col-span-2">{createState.error}</p>
            )}
            {createState.success && (
              <p className="text-sm text-emerald-700 sm:col-span-2">
                {createState.message}
              </p>
            )}
            <Button type="submit" disabled={createPending}>
              {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সেশন তৈরি"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>রোলওভার উইজার্ড</CardTitle>
          <CardDescription>
            পুরনো সেশনের ক্লাস ক্লোন → শিক্ষার্থী নতুন সেশনের ম্যাচিং ক্লাসে স্থানান্তর
            (সেকশন রিসেট)। আগে নতুন সেশন তৈরি করুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          {years.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              রোলওভারের জন্য অন্তত দুইটি সেশন লাগবে।
            </p>
          ) : (
            <form action={rollAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">সোর্স সেশন</span>
                  <select
                    name="fromYearId"
                    defaultValue={current?.id}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.nameBn || y.name}
                        {y.isCurrent ? " (বর্তমান)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">টার্গেট সেশন</span>
                  <select
                    name="toYearId"
                    defaultValue={years.find((y) => !y.isCurrent)?.id || years[0]?.id}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.nameBn || y.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="cloneClasses" defaultChecked />
                ক্লাস ও সেকশন ক্লোন করুন
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="moveStudents" />
                সক্রিয় শিক্ষার্থীদের নতুন সেশনে স্থানান্তর করুন
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="setCurrent" />
                টার্গেট সেশনকে বর্তমান করুন
              </label>
              {rollState.error && (
                <p className="text-sm text-red-600">{rollState.error}</p>
              )}
              {rollState.success && (
                <p className="text-sm text-emerald-700">{rollState.message}</p>
              )}
              <Button type="submit" disabled={rollPending}>
                {rollPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "রোলওভার চালান"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
