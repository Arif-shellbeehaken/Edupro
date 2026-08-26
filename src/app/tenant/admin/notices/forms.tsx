"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createNoticeAction, type ExtState } from "@/application/use-cases/extended/actions";

const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

export function ModuleForm() {
  const [state, action, pending] = useActionState(createNoticeAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle>নতুন নোটিশ · SMS</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <input name="title" required placeholder="শিরোনাম *" className={inputClass} />
          <input name="titleBn" placeholder="বাংলা শিরোনাম" className={inputClass} />
          <select name="audience" className={inputClass} defaultValue="ALL">
            <option value="ALL">সবাই</option>
            <option value="STUDENTS">শিক্ষার্থী</option>
            <option value="STAFF">স্টাফ</option>
            <option value="PARENTS">অভিভাবক</option>
          </select>
          <textarea name="body" required placeholder="বিবরণ *" className={inputClass + " min-h-24 sm:col-span-2"} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="sendSms" />
            অডিয়েন্সকে bulk SMS
          </label>
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? "সংরক্ষণ…" : "প্রকাশ"}
          </Button>
          {state.error && <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
