"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createLeaveAction,
  reviewLeaveAction,
  type LeaveState,
} from "@/application/use-cases/hr/leave";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

type StaffOpt = { id: string; name: string; employeeId: string };
type LeaveItem = {
  id: string;
  leaveType: string;
  days: number;
  staff: { name: string; nameBn: string | null; employeeId: string };
};

export function LeaveForms({
  staff,
  pendingLeaves,
}: {
  staff: StaffOpt[];
  pendingLeaves: LeaveItem[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createLeaveAction,
    {} as LeaveState
  );
  const [reviewState, reviewAction, reviewPending] = useActionState(
    reviewLeaveAction,
    {} as LeaveState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন ছুটির আবেদন</CardTitle>
          <CardDescription>স্টাফ সিলেক্ট করে আবেদন করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="space-y-3">
            <select name="staffId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                স্টাফ *
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeId})
                </option>
              ))}
            </select>
            <select name="leaveType" className={inputClass} defaultValue="CASUAL">
              <option value="CASUAL">ক্যাজুয়াল</option>
              <option value="SICK">অসুস্থতা</option>
              <option value="EARNED">অর্জিত</option>
              <option value="UNPAID">বেতনবিহীন</option>
              <option value="MATERNITY">মাতৃত্ব</option>
              <option value="OTHER">অন্যান্য</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="startDate" type="date" required className={inputClass} />
              <input name="endDate" type="date" required className={inputClass} />
            </div>
            <input name="reason" placeholder="কারণ (ঐচ্ছিক)" className={inputClass} />
            {createState.error && (
              <p className="text-xs text-red-600">{createState.error}</p>
            )}
            {createState.success && (
              <p className="text-xs text-emerald-600">আবেদন জমা হয়েছে</p>
            )}
            <Button type="submit" className="w-full" disabled={createPending || staff.length === 0}>
              {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "আবেদন জমা"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">পেন্ডিং অনুমোদন</CardTitle>
          <CardDescription>{pendingLeaves.length} টি অপেক্ষমাণ · অনুমোদন/বাতিলের পর স্টাফ SMS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">কোনো পেন্ডিং আবেদন নেই</p>
          ) : (
            pendingLeaves.map((lv) => (
              <div key={lv.id} className="rounded-lg border border-border/60 p-3 space-y-2">
                <p className="text-sm font-medium">
                  {lv.staff.nameBn || lv.staff.name} — {lv.leaveType} ({lv.days} দিন)
                </p>
                <form action={reviewAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="leaveId" value={lv.id} />
                  <input
                    name="reviewNote"
                    placeholder="নোট"
                    className="h-9 flex-1 rounded-lg border px-2 text-sm"
                  />
                  <Button
                    type="submit"
                    name="decision"
                    value="APPROVED"
                    size="sm"
                    disabled={reviewPending}
                  >
                    অনুমোদন
                  </Button>
                  <Button
                    type="submit"
                    name="decision"
                    value="REJECTED"
                    size="sm"
                    variant="destructive"
                    disabled={reviewPending}
                  >
                    প্রত্যাখ্যান
                  </Button>
                </form>
              </div>
            ))
          )}
          {reviewState.error && (
            <p className="text-xs text-red-600">{reviewState.error}</p>
          )}
          {reviewState.success && (
            <p className="text-xs text-emerald-600">আপডেট হয়েছে</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
