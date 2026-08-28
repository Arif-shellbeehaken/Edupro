import { NpsSurveyForm } from "./nps-form";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SurveysPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listSurveys>> = [];
  try { rows = await extendedOpsRepository.listSurveys(); } catch { /* empty */ }
  return (
    <div className="page-pad">
      <NpsSurveyForm />
      <div>
        <h1 className="page-title">ফিডব্যাক / সার্ভে</h1>
        <p className="text-sm text-muted-foreground">NPS · অভিভাবক সন্তুষ্টি</p>
      </div>
      <ModuleForm />
      <div className="space-y-2">
        {rows.length === 0 ? (
        <EmptyState title="কোনো সার্ভে নেই" />
      ) : rows.map((s) => {
          const scores = s.responses.map((r) => r.score).filter((x): x is number => x != null);
          const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
          return (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{s.status}</Badge>
                  <span className="text-sm tabular-nums">রেসপন্স {s.responses.length} · গড় {avg}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
