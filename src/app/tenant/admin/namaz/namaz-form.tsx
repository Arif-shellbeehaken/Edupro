"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNamazAction, type NamazState } from "@/application/use-cases/namaz/mark";

const selectClass =
  "h-8 rounded border border-zinc-200 bg-background px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500";

const PRAYERS = [
  { key: "fajr", label: "ফজর" },
  { key: "dhuhr", label: "যোহর" },
  { key: "asr", label: "আসর" },
  { key: "maghrib", label: "মাগরিব" },
  { key: "isha", label: "এশা" },
] as const;

export function NamazForm({
  students,
  defaultDate,
}: {
  students: { id: string; name: string; studentId: string }[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(markNamazAction, {} as NamazState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium">তারিখ</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className="flex h-9 rounded-lg border px-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সংরক্ষণ"}
        </Button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.count} জনের নামাজ সংরক্ষিত</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 pr-2">শিক্ষার্থী</th>
              {PRAYERS.map((p) => (
                <th key={p.key} className="px-1 py-2">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-border/50">
                <td className="py-2 pr-2">
                  <input type="hidden" name="studentId" value={s.id} />
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.studentId}</p>
                </td>
                {PRAYERS.map((p) => (
                  <td key={p.key} className="px-1 py-2">
                    <select
                      name={`${p.key}__${s.id}`}
                      defaultValue="PRESENT"
                      className={selectClass}
                    >
                      <option value="PRESENT">✓</option>
                      <option value="ABSENT">✗</option>
                      <option value="LATE">লেট</option>
                      <option value="EXCUSED">মাফ</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
