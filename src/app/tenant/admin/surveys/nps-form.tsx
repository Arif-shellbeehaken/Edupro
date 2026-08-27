"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  sendParentNpsSurveyAction,
  type NpsState,
} from "@/application/use-cases/survey/nps-sms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NpsSurveyForm() {
  const [state, action, pending] = useActionState(
    sendParentNpsSurveyAction,
    {} as NpsState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">অভিভাবক NPS / ফিডব্যাক SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-2">
          <input
            name="title"
            defaultValue="অভিভাবক সন্তুষ্টি জরিপ (NPS)"
            className="flex h-10 w-full rounded-md border px-3 text-sm"
          />
          <input
            name="note"
            placeholder="অতিরিক্ত নির্দেশনা"
            className="flex h-10 w-full rounded-md border px-3 text-sm"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "NPS SMS পাঠান"}
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
