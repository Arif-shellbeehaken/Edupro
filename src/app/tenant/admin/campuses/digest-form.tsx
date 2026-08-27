"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  sendCampusReportDigestAction,
  type CampusDigestState,
} from "@/application/use-cases/campus/report-digest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CampusDigestForm() {
  const [state, action, pending] = useActionState(
    sendCampusReportDigestAction,
    {} as CampusDigestState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">মাল্টি-ক্যাম্পাস রিপোর্ট ডাইজেস্ট</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "ডাইজেস্ট SMS পাঠান"
            )}
          </Button>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state.success && (
            <p className="text-xs text-emerald-600">{state.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
