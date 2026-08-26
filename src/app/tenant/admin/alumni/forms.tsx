"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAlumniAction, type ExtState } from "@/application/use-cases/extended/actions";

const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

export function ModuleForm() {
  const [state, action, pending] = useActionState(createAlumniAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle>নতুন এন্ট্রি</CardTitle></CardHeader>
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
