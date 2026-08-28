"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAlumniAction, type ExtState } from "@/application/use-cases/extended/actions";

const inputClass = "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm";

export function ModuleForm() {
  const [state, action, pending] = useActionState(createAlumniAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle>নতুন অ্যালামনাই · SMS</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <input name="name" required placeholder="নাম *" className={inputClass} />
          <input name="nameBn" placeholder="বাংলা নাম" className={inputClass} />
          <input name="phone" placeholder="ফোন" className={inputClass} />
          <input name="email" placeholder="ইমেইল" className={inputClass} />
          <input name="graduationYear" type="number" placeholder="পাসের বছর" className={inputClass} />
          <input name="lastClass" placeholder="শেষ ক্লাস" className={inputClass} />
          <input name="currentJob" placeholder="বর্তমান পেশা" className={inputClass} />
          <input name="organization" placeholder="প্রতিষ্ঠান" className={inputClass} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="sendSms" defaultChecked />
            ফোনে স্বাগতম SMS
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
