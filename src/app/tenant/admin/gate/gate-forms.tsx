"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checkInVisitorAction,
  checkOutVisitorAction,
  type ExtState,
} from "@/application/use-cases/donations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function GateForms({
  insideVisitors,
}: {
  insideVisitors: { id: string; name: string; purpose: string | null }[];
}) {
  const [inState, inAction, inPending] = useActionState(checkInVisitorAction, {} as ExtState);
  const [outState, outAction, outPending] = useActionState(checkOutVisitorAction, {} as ExtState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">চেক-ইন · হোস্ট SMS</CardTitle></CardHeader>
        <CardContent>
          <form action={inAction} className="space-y-2">
            <input name="visitorName" required placeholder="নাম *" className={inputClass} />
            <input name="visitorPhone" placeholder="ফোন" className={inputClass} />
            <input name="purpose" placeholder="উদ্দেশ্য" className={inputClass} />
            <input name="hostName" placeholder="কার সাথে দেখা" className={inputClass} />
            <input name="hostPhone" placeholder="হোস্ট ফোন (SMS)" className={inputClass} />
            <input name="vehicleNo" placeholder="গাড়ির নম্বর" className={inputClass} />
            {inState.error && <p className="text-xs text-red-600">{inState.error}</p>}
            {inState.success && <p className="text-xs text-emerald-600">{inState.message || "চেক-ইন হয়েছে"}</p>}
            <Button type="submit" disabled={inPending}>
              {inPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "চেক-ইন"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">চেক-আউট</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {insideVisitors.length === 0 ? (
            <p className="text-sm text-muted-foreground">কেউ ভিতরে নেই</p>
          ) : (
            insideVisitors.map((v) => (
              <form key={v.id} action={outAction} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm">{v.name}</span>
                <input type="hidden" name="visitorId" value={v.id} />
                <Button type="submit" size="sm" variant="outline" disabled={outPending}>আউট</Button>
              </form>
            ))
          )}
          {outState.success && <p className="text-xs text-emerald-600">চেক-আউট হয়েছে</p>}
        </CardContent>
      </Card>
    </div>
  );
}
