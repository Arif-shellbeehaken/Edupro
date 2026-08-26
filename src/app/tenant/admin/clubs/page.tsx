import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClubsPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listClubs>> = [];
  try { rows = await extendedOpsRepository.listClubs(); } catch { /* empty */ }
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">ক্লাব ও এক্সট্রাকারিকুলার</h1>
        <p className="text-sm text-muted-foreground">ক্রীড়া · সাংস্কৃতিক · একাডেমিক</p>
      </div>
      <ModuleForm />
      <div className="space-y-2">
        {rows.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{c.nameBn || c.name}</p>
                <p className="text-xs text-muted-foreground">{c.coachName || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{c.category}</Badge>
                <span className="text-sm">{c.members.length} সদস্য</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
