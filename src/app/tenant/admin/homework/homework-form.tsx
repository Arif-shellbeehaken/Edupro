"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createHomeworkAction,
  notifyHomeworkAction,
  notifyDueHomeworkAction,
  type ExtState,
} from "@/application/use-cases/donations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function HomeworkForm({
  classes = [],
  homeworks = [],
}: {
  classes?: { id: string; name: string; nameBn: string | null }[];
  homeworks?: { id: string; title: string; status: string }[];
}) {
  const [state, action, pending] = useActionState(
    createHomeworkAction,
    {} as ExtState
  );
  const [nState, nAction, nPending] = useActionState(
    notifyHomeworkAction,
    {} as ExtState
  );
  const [dState, dAction, dPending] = useActionState(
    notifyDueHomeworkAction,
    {} as ExtState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন হোমওয়ার্ক</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-2 sm:grid-cols-2">
            <input
              name="title"
              required
              placeholder="শিরোনাম *"
              className={inputClass}
            />
            <input
              name="subjectName"
              placeholder="বিষয়"
              className={inputClass}
            />
            <select name="classId" className={inputClass} defaultValue="">
              <option value="">সব ক্লাস / সাধারণ</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </select>
            <input name="dueDate" type="date" className={inputClass} />
            <input
              name="description"
              placeholder="বিবরণ"
              className={`${inputClass} sm:col-span-2`}
            />
            <div className="sm:col-span-2">
              {state.error && (
                <p className="text-xs text-red-600">{state.error}</p>
              )}
              {state.success && (
                <p className="text-xs text-emerald-600">তৈরি হয়েছে</p>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "প্রকাশ"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">হোমওয়ার্ক রিমাইন্ডার SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={nAction} className="space-y-2">
            <select
              name="homeworkId"
              required
              className={inputClass}
              defaultValue=""
            >
              <option value="">হোমওয়ার্ক বাছুন…</option>
              {homeworks
                .filter((h) => h.status === "ACTIVE")
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground">
              ক্লাস বাঁধা থাকলে শুধু সেই ক্লাসের অভিভাবক; নাহলে সব সক্রিয় শিক্ষার্থী
            </p>
            {nState.error && (
              <p className="text-xs text-red-600">{nState.error}</p>
            )}
            {nState.success && (
              <p className="text-xs text-emerald-600">
                {nState.message || "পাঠানো হয়েছে"}
              </p>
            )}
            <Button type="submit" disabled={nPending || homeworks.length === 0}>
              {nPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "রিমাইন্ডার পাঠান"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">আসন্ন ডিউ রিমাইন্ডার</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={dAction} className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              দিন
              <input
                name="days"
                type="number"
                defaultValue={2}
                min={1}
                max={14}
                className={inputClass + " w-20"}
              />
            </label>
            <Button type="submit" disabled={dPending}>
              {dPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ডিউ SMS পাঠান"}
            </Button>
            {dState.error && <p className="text-xs text-red-600">{dState.error}</p>}
            {dState.success && (
              <p className="text-xs text-emerald-600">{dState.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
