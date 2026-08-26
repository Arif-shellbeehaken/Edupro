"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMaterialAction, type ExtState } from "@/application/use-cases/extended/actions";

const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

export function ModuleForm() {
  const [state, action, pending] = useActionState(createMaterialAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle>নতুন এন্ট্রি</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <input name="title" required placeholder="শিরোনাম *" className={inputClass} />
          <input name="className" placeholder="ক্লাস" className={inputClass} />
          <input name="subject" placeholder="বিষয়" className={inputClass} />
          <select name="materialType" className={inputClass} defaultValue="NOTE">
            <option value="NOTE">নোট</option>
            <option value="VIDEO">ভিডিও</option>
            <option value="LINK">লিংক</option>
            <option value="FILE">ফাইল</option>
          </select>
          <input name="url" placeholder="URL" className={inputClass + " sm:col-span-2"} />
          <textarea name="body" placeholder="বিবরণ" className={inputClass + " min-h-20 sm:col-span-2"} />
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
