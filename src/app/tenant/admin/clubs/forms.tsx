"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createClubAction,
  addClubMemberAction,
  type ExtState,
} from "@/application/use-cases/extended/actions";

const inputClass =
  "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm";

export function ModuleForm({
  clubs = [],
  students = [],
}: {
  clubs?: { id: string; name: string; nameBn: string | null }[];
  students?: { id: string; name: string; nameBn: string | null; studentId: string }[];
}) {
  const [state, action, pending] = useActionState(createClubAction, {} as ExtState);
  const [mState, mAction, mPending] = useActionState(
    addClubMemberAction,
    {} as ExtState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>নতুন ক্লাব</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-2 sm:grid-cols-2">
            <input name="name" required placeholder="ক্লাবের নাম *" className={inputClass} />
            <input name="nameBn" placeholder="বাংলা নাম" className={inputClass} />
            <select name="category" className={inputClass} defaultValue="SPORTS">
              <option value="SPORTS">ক্রীড়া</option>
              <option value="CULTURAL">সাংস্কৃতিক</option>
              <option value="ACADEMIC">একাডেমিক</option>
              <option value="RELIGIOUS">ধর্মীয়</option>
              <option value="GENERAL">সাধারণ</option>
            </select>
            <input name="coachName" placeholder="কোচ/পরিচালক" className={inputClass} />
            <Button type="submit" disabled={pending} className="sm:col-span-2">
              {pending ? "সংরক্ষণ…" : "ক্লাব তৈরি"}
            </Button>
            {state.error && (
              <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p>
            )}
            {state.success && (
              <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>সদস্য যোগ · অভিভাবক SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={mAction} className="grid gap-2">
            <select name="clubId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                ক্লাব *
              </option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </select>
            <select name="studentId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                শিক্ষার্থী *
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameBn || s.name} ({s.studentId})
                </option>
              ))}
            </select>
            <select name="role" className={inputClass} defaultValue="MEMBER">
              <option value="MEMBER">সদস্য</option>
              <option value="CAPTAIN">ক্যাপ্টেন</option>
              <option value="SECRETARY">সচিব</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sendSms" defaultChecked />
              অভিভাবককে SMS
            </label>
            <Button type="submit" disabled={mPending || clubs.length === 0}>
              {mPending ? "যোগ…" : "সদস্য যোগ"}
            </Button>
            {mState.error && (
              <p className="text-sm text-destructive">{mState.error}</p>
            )}
            {mState.success && (
              <p className="text-sm text-green-700">{mState.success}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
