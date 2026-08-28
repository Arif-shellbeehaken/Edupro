import { EmptyState } from "@/components/ui/empty-state";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LmsPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listMaterials>> = [];
  try { rows = await extendedOpsRepository.listMaterials(); } catch { /* empty */ }
  return (
    <div className="page-pad">
      <div>
        <h1 className="page-title">LMS / স্টাডি ম্যাটেরিয়াল</h1>
        <p className="text-sm text-muted-foreground">নোট · ভিডিও · লিংক</p>
      </div>
      <ModuleForm />
      <div className="space-y-2">
        {rows.length === 0 ? (
        <EmptyState title="কোনো ম্যাটেরিয়াল নেই" />
      ) : rows.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[m.className, m.subject].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{m.materialType}</Badge>
                {m.url && (
                  <a href={m.url} className="text-sm text-primary underline" target="_blank" rel="noreferrer">
                    খুলুন
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
