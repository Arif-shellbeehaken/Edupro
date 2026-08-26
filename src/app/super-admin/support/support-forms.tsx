"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateSupportTicketAction,
  type TicketState,
} from "@/application/use-cases/support/actions";

export function SupportAdminForms({
  tickets,
}: {
  tickets: {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    tenantName: string;
    assigneeNote: string | null;
    createdAt: string;
  }[];
}) {
  const [state, action, pending] = useActionState(
    updateSupportTicketAction,
    {} as TicketState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>টিকিট কিউ</CardTitle>
        <CardDescription>স্ট্যাটাস ও নোট · ক্রিয়েটর SMS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            কোনো টিকিট নেই — টেনান্ট Settings থেকে সাপোর্ট রিকোয়েস্ট পাঠাতে পারে
          </p>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.tenantName} · {t.category} ·{" "}
                    {new Date(t.createdAt).toLocaleString("bn-BD")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Badge variant="secondary">{t.priority}</Badge>
                  <Badge
                    variant={
                      t.status === "RESOLVED" || t.status === "CLOSED"
                        ? "success"
                        : t.status === "OPEN"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <form action={action} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="ticketId" value={t.id} />
                <select
                  name="status"
                  defaultValue={t.status}
                  className="h-9 rounded-lg border px-2 text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING">Waiting</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <input
                  name="assigneeNote"
                  defaultValue={t.assigneeNote || ""}
                  placeholder="অ্যাডমিন নোট"
                  className="h-9 min-w-[160px] flex-1 rounded-lg border px-2 text-sm"
                />
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "সেভ"}
                </Button>
              </form>
            </div>
          ))
        )}
        {state.success && (
          <p className="text-xs text-emerald-600">{state.message}</p>
        )}
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </CardContent>
    </Card>
  );
}
