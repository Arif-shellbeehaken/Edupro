"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyLeaveBalanceAction,
  type LeaveState,
} from "@/application/use-cases/hr/leave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeaveBalanceForm({
  staff,
}: {
  staff: { id: string; name: string; nameBn: string | null; employeeId: string }[];
}) {
  const [state, action, pending] = useActionState(
    notifyLeaveBalanceAction,
    {} as LeaveState
  );
  const year = new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ছুটি ব্যালেন্স SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <select name="staffId" className="h-9 rounded-md border px-2 text-sm" defaultValue="">
            <option value="">সব স্টাফ</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameBn || s.name} ({s.employeeId})
              </option>
            ))}
          </select>
          <input type="hidden" name="year" value={year} />
          <input
            name="quotaCasual"
            type="number"
            defaultValue={14}
            className="h-9 rounded-md border px-2 text-sm"
            placeholder="ক্যাজুয়াল কোটা"
          />
          <input
            name="quotaSick"
            type="number"
            defaultValue={10}
            className="h-9 rounded-md border px-2 text-sm"
            placeholder="সিক কোটা"
          />
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ব্যালেন্স SMS"}
          </Button>
          {state.error && <p className="text-xs text-red-600 sm:col-span-2">{state.error}</p>}
          {state.success && (
            <p className="text-xs text-emerald-600 sm:col-span-2">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
