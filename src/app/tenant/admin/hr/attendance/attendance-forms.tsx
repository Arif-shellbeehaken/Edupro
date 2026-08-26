"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bulkMarkStaffAttendanceAction,
  type StaffAttendanceState,
} from "@/application/use-cases/hr/staff-attendance";

type StaffRow = {
  id: string;
  name: string;
  nameBn: string | null;
  employeeId: string;
  designation: string;
  currentStatus?: string;
};

const statuses = [
  { value: "PRESENT", label: "উপস্থিত" },
  { value: "ABSENT", label: "অনুপস্থিত" },
  { value: "LATE", label: "লেট" },
  { value: "HALF_DAY", label: "হাফ ডে" },
  { value: "LEAVE", label: "ছুটি" },
  { value: "HOLIDAY", label: "ছুটির দিন" },
];

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

export function StaffAttendanceForm({
  date,
  staff,
}: {
  date: string;
  staff: StaffRow[];
}) {
  const [state, action, pending] = useActionState(
    bulkMarkStaffAttendanceAction,
    {} as StaffAttendanceState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>দৈনিক স্টাফ উপস্থিতি</CardTitle>
        <CardDescription>{date} · {staff.length} জন</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="date" value={date} />
          <div className="space-y-2">
            {staff.length === 0 && (
              <p className="text-sm text-muted-foreground">কোনো স্টাফ নেই</p>
            )}
            {staff.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{s.nameBn || s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.employeeId} · {s.designation}
                  </p>
                </div>
                <select
                  name={`status_${s.id}`}
                  className={inputClass + " max-w-[140px]"}
                  defaultValue={s.currentStatus || "PRESENT"}
                >
                  {statuses.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-green-700">{state.success}</p>}
          <Button type="submit" disabled={pending || staff.length === 0}>
            {pending ? "সংরক্ষণ হচ্ছে…" : "সব মার্ক সংরক্ষণ"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
