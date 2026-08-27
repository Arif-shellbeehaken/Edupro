"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import {
  exportAuditLogAction,
  type AuditExportState,
} from "@/application/use-cases/audit/export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuditExportForm() {
  const [state, action, pending] = useActionState(
    exportAuditLogAction,
    {} as AuditExportState
  );

  useEffect(() => {
    if (state.success && state.csv) {
      const blob = new Blob([state.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">অডিট এক্সপোর্ট · SMS নোটিশ</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            দিন
            <input
              name="days"
              type="number"
              defaultValue={30}
              min={1}
              max={90}
              className="ml-2 h-9 w-20 rounded-md border px-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify" defaultChecked />
            অ্যাডমিন SMS
          </label>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="mr-1 h-4 w-4" />
                CSV এক্সপোর্ট
              </>
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
