"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  updateStudentStatusAction,
  type UpdateStatusState,
} from "@/application/use-cases/students/update-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

export function StudentStatusForm({
  students,
}: {
  students: { id: string; name: string; nameBn: string | null; studentId: string; status: string }[];
}) {
  const [state, action, pending] = useActionState(
    updateStudentStatusAction,
    {} as UpdateStatusState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">স্ট্যাটাস পরিবর্তন · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <select name="studentId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              শিক্ষার্থী *
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameBn || s.name} ({s.studentId}) — {s.status}
              </option>
            ))}
          </select>
          <select name="status" required className={inputClass} defaultValue="LEFT">
            <option value="ACTIVE">সক্রিয়</option>
            <option value="LEFT">প্রস্থান (LEFT)</option>
            <option value="SUSPENDED">সাসপেন্ড</option>
            <option value="GRADUATED">গ্র্যাজুয়েট</option>
            <option value="TRANSFERRED">ট্রান্সফার</option>
          </select>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "আপডেট"}
          </Button>
          {state.error && (
            <p className="sm:col-span-3 text-xs text-red-600">{state.error}</p>
          )}
          {state.success && (
            <p className="sm:col-span-3 text-xs text-emerald-600">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
