"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSurveyAction, type ExtState } from "@/application/use-cases/extended/actions";

const inputClass = "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm";

export function ModuleForm() {
  const [state, action, pending] = useActionState(createSurveyAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle>নতুন এন্ট্রি</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <input name="title" required placeholder="সার্ভে শিরোনাম *" className={inputClass} />
          <select name="audience" className={inputClass} defaultValue="PARENTS">
            <option value="PARENTS">অভিভাবক</option>
            <option value="STAFF">স্টাফ</option>
            <option value="STUDENTS">শিক্ষার্থী</option>
          </select>
          <textarea name="description" placeholder="বিবরণ" className={inputClass + " min-h-20 sm:col-span-2"} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="sendSms" />
            অডিয়েন্সকে SMS নোটিশ
          </label>
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? "সংরক্ষণ…" : "সংরক্ষণ"}
          </Button>
          {state.error && <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
