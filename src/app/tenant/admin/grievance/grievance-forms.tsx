"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createGrievanceAction,
  updateGrievanceAction,
  type ExtState,
} from "@/application/use-cases/donations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function GrievanceForms({
  openItems,
}: {
  openItems: { id: string; subject: string; status: string }[];
}) {
  const [cState, cAction, cPending] = useActionState(createGrievanceAction, {} as ExtState);
  const [uState, uAction, uPending] = useActionState(updateGrievanceAction, {} as ExtState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">নতুন অভিযোগ</CardTitle></CardHeader>
        <CardContent>
          <form action={cAction} className="space-y-2">
            <input name="submittedBy" placeholder="জমাদাতা" className={inputClass} />
            <input name="contactPhone" placeholder="ফোন" className={inputClass} />
            <select name="category" className={inputClass} defaultValue="GENERAL">
              <option value="ACADEMIC">একাডেমিক</option>
              <option value="FEE">ফি</option>
              <option value="STAFF">স্টাফ</option>
              <option value="FACILITY">সুবিধা</option>
              <option value="GENERAL">সাধারণ</option>
            </select>
            <input name="subject" required placeholder="বিষয় *" className={inputClass} />
            <textarea name="description" required placeholder="বিবরণ *" className="min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm" />
            <select name="priority" className={inputClass} defaultValue="MEDIUM">
              <option value="LOW">কম</option>
              <option value="MEDIUM">মাঝারি</option>
              <option value="HIGH">উচ্চ</option>
            </select>
            {cState.error && <p className="text-xs text-red-600">{cState.error}</p>}
            {cState.success && <p className="text-xs text-emerald-600">জমা হয়েছে</p>}
            <Button type="submit" disabled={cPending}>
              {cPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "জমা দিন"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">স্ট্যাটাস আপডেট · SMS</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {openItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">ওপেন অভিযোগ নেই</p>
          ) : (
            openItems.map((g) => (
              <form key={g.id} action={uAction} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
                <span className="min-w-[100px] flex-1 text-sm">{g.subject}</span>
                <input type="hidden" name="grievanceId" value={g.id} />
                <select name="status" className="h-9 rounded-lg border px-2 text-sm" defaultValue={g.status}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <Button type="submit" size="sm" disabled={uPending}>সেভ</Button>
              </form>
            ))
          )}
          {uState.success && <p className="text-xs text-emerald-600">আপডেট হয়েছে</p>}
        </CardContent>
      </Card>
    </div>
  );
}
