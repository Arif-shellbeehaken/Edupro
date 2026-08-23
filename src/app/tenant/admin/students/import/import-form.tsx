"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bulkImportStudentsAction,
  type BulkImportState,
} from "@/application/use-cases/students/bulk-import";

export function BulkImportForm() {
  const [state, action, pending] = useActionState(
    bulkImportStudentsAction,
    {} as BulkImportState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ইমপোর্ট করুন</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div>
            <label className="text-sm font-medium">CSV ফাইল</label>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              className="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">অথবা CSV পেস্ট</label>
            <textarea
              name="csvText"
              rows={8}
              placeholder="name,gender,..."
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs"
            />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.success && (
            <p className="text-sm text-emerald-600">{state.message}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ইমপোর্ট হচ্ছে...
              </>
            ) : (
              "ইমপোর্ট শুরু"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
