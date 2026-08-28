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
      <CardHeader><CardTitle>নতুন ম্যাটেরিয়াল · SMS</CardTitle></CardHeader>
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
            <option value="MEET">Google Meet</option>
            <option value="ZOOM">Zoom</option>
          </select>
          <input
            name="url"
            placeholder="URL / Meet / Zoom link"
            className={inputClass + " sm:col-span-2"}
          />
          <p className="text-[11px] text-muted-foreground sm:col-span-2">
            Meet/Zoom: পূর্ণ join URL দিন (https://meet.google.com/... বা https://zoom.us/j/...)
          </p>
          <textarea name="body" placeholder="বিবরণ" className={inputClass + " min-h-20 sm:col-span-2"} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="sendSms" />
            অভিভাবকদের bulk SMS (সব / ক্লাস)
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
