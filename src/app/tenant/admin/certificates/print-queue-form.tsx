"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  notifyCertificatePrintReadyAction,
  type CertState,
} from "@/application/use-cases/certificates/issue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrintQueueForm({
  certs,
}: {
  certs: { id: string; certificateNo: string; studentName: string; certType: string }[];
}) {
  const [state, action, pending] = useActionState(
    notifyCertificatePrintReadyAction,
    {} as CertState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">প্রিন্ট কিউ · SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-wrap items-end gap-2">
          <select
            name="certId"
            required
            className="h-9 min-w-[220px] rounded-md border px-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              সার্টিফিকেট *
            </option>
            {certs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.certificateNo} — {c.studentName} ({c.certType})
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={pending || certs.length === 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "প্রিন্ট কিউ + SMS"}
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
