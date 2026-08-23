"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createHomeworkAction, type ExtState } from "@/application/use-cases/donations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function HomeworkForm() {
  const [state, action, pending] = useActionState(createHomeworkAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">নতুন হোমওয়ার্ক</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <input name="title" required placeholder="শিরোনাম *" className={inputClass} />
          <input name="subjectName" placeholder="বিষয়" className={inputClass} />
          <input name="dueDate" type="date" className={inputClass} />
          <input name="description" placeholder="বিবরণ" className={inputClass} />
          <div className="sm:col-span-2">
            {state.error && <p className="text-xs text-red-600">{state.error}</p>}
            {state.success && <p className="text-xs text-emerald-600">তৈরি হয়েছে</p>}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "প্রকাশ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
