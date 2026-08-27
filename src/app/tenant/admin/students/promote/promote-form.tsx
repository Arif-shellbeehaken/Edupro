"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  promoteBatchAction,
  generateClassFeesAction,
  type PromoteState,
} from "@/application/use-cases/students/promote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ClassRow = {
  id: string;
  name: string;
  nameBn: string | null;
  academicYearId: string;
  sections: { id: string; name: string }[];
};

type StudentRow = {
  id: string;
  name: string;
  nameBn: string | null;
  studentId: string;
  currentClassId: string | null;
};

export function PromoteForm({
  classes,
  students,
}: {
  classes: ClassRow[];
  students: StudentRow[];
}) {
  const [fromClassId, setFromClassId] = useState(classes[0]?.id ?? "");
  const [toClassId, setToClassId] = useState(classes[1]?.id ?? classes[0]?.id ?? "");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [direction, setDirection] = useState<"promote" | "demote">("promote");
  const [state, formAction, pending] = useActionState(
    promoteBatchAction,
    {} as PromoteState
  );
  const [feeState, feeAction, feePending] = useActionState(
    generateClassFeesAction,
    {} as PromoteState
  );

  const fromStudents = useMemo(
    () => students.filter((s) => s.currentClassId === fromClassId),
    [students, fromClassId]
  );

  const toClass = classes.find((c) => c.id === toClassId);
  const sections = toClass?.sections ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ব্যাচ প্রমোশন / ডিমোশন</CardTitle>
          <CardDescription>
            প্রমোট = উপরের ক্লাসে · ডিমোট/হোল্ড-ব্যাক রিভার্স = নিচের/অন্য ক্লাসে ·
            সিলেক্ট মোডে যাদের টিক নেই তারা সোর্স ক্লাসেই থাকবে (hold-back)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">দিক</span>
                <select
                  name="direction"
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as "promote" | "demote")
                  }
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="promote">প্রমোশন</option>
                  <option value="demote">ডিমোশন / ফেরত</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">মোড</span>
                <select
                  name="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "all" | "selected")}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="all">
                    সোর্স ক্লাসের সবাই ({fromStudents.length})
                  </option>
                  <option value="selected">সিলেক্টেড (বাকি hold-back)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">সোর্স ক্লাস</span>
                <select
                  name="fromClassId"
                  value={fromClassId}
                  onChange={(e) => setFromClassId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn || c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">টার্গেট ক্লাস</span>
                <select
                  name="toClassId"
                  value={toClassId}
                  onChange={(e) => setToClassId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn || c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">
                  টার্গেট সেকশন (ঐচ্ছিক)
                </span>
                <select
                  name="toSectionId"
                  defaultValue=""
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">সেকশন ছাড়া</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {mode === "selected" && (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
                {fromStudents.length === 0 && (
                  <p className="text-sm text-muted-foreground">এই ক্লাসে কেউ নেই</p>
                )}
                {fromStudents.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <input type="checkbox" name="studentIds" value={s.id} />
                    <span>
                      {s.nameBn || s.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({s.studentId})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="generateFees" />
              টার্গেট ক্লাসের ফি স্ট্রাকচার থেকে চালান অটো-জেনারেট করুন
            </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify" defaultChecked />
            অভিভাবককে প্রমোট/ট্রান্সফার SMS
          </label>

            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            {state.success && (
              <p className="text-sm text-emerald-700">সফল: {state.message}</p>
            )}

            <Button type="submit" disabled={pending || fromStudents.length === 0}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : direction === "demote" ? (
                "ডিমোট নিশ্চিত"
              ) : (
                "প্রমোশন নিশ্চিত"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ক্লাস ফি চালান (শুধু বিল)</CardTitle>
          <CardDescription>
            শিক্ষার্থী না সরিয়ে শুধু ওই ক্লাসের সক্রিয়দের জন্য ফি চালান তৈরি
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={feeAction} className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">ক্লাস</span>
              <select
                name="classId"
                defaultValue={classes[0]?.id}
                className="flex h-10 min-w-[200px] rounded-lg border border-border bg-background px-3 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn || c.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="outline" disabled={feePending}>
              {feePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "চালান তৈরি"}
            </Button>
          </form>
          {feeState.error && (
            <p className="mt-2 text-sm text-red-600">{feeState.error}</p>
          )}
          {feeState.success && (
            <p className="mt-2 text-sm text-emerald-700">{feeState.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
