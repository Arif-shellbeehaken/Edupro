"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  promoteBatchAction,
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
  const [state, formAction, pending] = useActionState(
    promoteBatchAction,
    {} as PromoteState
  );

  const fromStudents = useMemo(
    () => students.filter((s) => s.currentClassId === fromClassId),
    [students, fromClassId]
  );

  const toClass = classes.find((c) => c.id === toClassId);
  const sections = toClass?.sections ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>ব্যাচ প্রমোশন</CardTitle>
        <CardDescription>
          একটি ক্লাসের সক্রিয় শিক্ষার্থীদের পরবর্তী ক্লাসে স্থানান্তর — সেকশন রিসেট হয়
          (টার্গেট সেকশন দিলে সেট হবে)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
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
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">টার্গেট সেকশন (ঐচ্ছিক)</span>
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
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">মোড</span>
              <select
                name="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "all" | "selected")}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="all">সোর্স ক্লাসের সবাই ({fromStudents.length})</option>
                <option value="selected">সিলেক্টেড শিক্ষার্থী</option>
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

          {mode === "all" && (
            <p className="text-sm text-muted-foreground">
              সোর্স ক্লাসে <strong>{fromStudents.length}</strong> জন সক্রিয় শিক্ষার্থী
              প্রমোট হবে।
            </p>
          )}

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-700">
              সফল: {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending || fromStudents.length === 0}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "প্রমোশন নিশ্চিত করুন"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
