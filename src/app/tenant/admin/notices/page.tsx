import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function NoticesPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listNotices>> = [];
  try { rows = await extendedOpsRepository.listNotices(); } catch { /* empty */ }
  return (
    <div className="page-pad">
      <div>
        <h1 className="text-2xl font-semibold">নোটিশ বোর্ড</h1>
        <p className="text-sm text-muted-foreground">ইভেন্ট · ছুটি · ঘোষণা</p>
      </div>
      <ModuleForm />
      <div className="space-y-2">
        {rows.map((n) => (
          <Card key={n.id}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{n.titleBn || n.title}</p>
                <Badge variant="secondary">{n.audience}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
