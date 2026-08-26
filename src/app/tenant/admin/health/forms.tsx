"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertHealthAction, type ExtState } from "@/application/use-cases/extended/actions";

const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

export function ModuleForm({ students }: { students: { id: string; name: string; nameBn: string | null }[] }) {
  const [state, action, pending] = useActionState(upsertHealthAction, {} as ExtState);
  return (
    <Card>
      <CardHeader><CardTitle>স্বাস্থ্য রেকর্ড</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-2 sm:grid-cols-2">
          <select name="studentId" required className={inputClass} defaultValue="">
            <option value="" disabled>শিক্ষার্থী *</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.nameBn || s.name}</option>
            ))}
          </select>
          <input name="bloodGroup" placeholder="রক্তের গ্রুপ" className={inputClass} />
          <input name="allergies" placeholder="অ্যালার্জি" className={inputClass} />
          <input name="chronicConditions" placeholder="দীর্ঘমেয়াদি রোগ" className={inputClass} />
          <input name="vaccinations" placeholder="টিকা" className={inputClass} />
          <input name="emergencyContact" placeholder="জরুরি যোগাযোগ" className={inputClass} />
          <textarea name="lastVisitNote" placeholder="শেষ ভিজিট নোট" className={inputClass + " min-h-16 sm:col-span-2"} />
          <textarea name="notes" placeholder="অন্যান্য নোট" className={inputClass + " min-h-16 sm:col-span-2"} />
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
