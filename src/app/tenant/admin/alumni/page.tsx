import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AlumniPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listAlumni>> = [];
  try { rows = await extendedOpsRepository.listAlumni(); } catch { /* empty */ }
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">অ্যালামনাই নেটওয়ার্ক</h1>
        <p className="text-sm text-muted-foreground">পাশ করা শিক্ষার্থী · ক্যারিয়ার</p>
      </div>
      <ModuleForm />
      <div className="space-y-2">
        {rows.length === 0 && (
            <EmptyState title="কোনো অ্যালামনাই নেই" description="পাশ করা শিক্ষার্থী যোগ করুন" />
          )}
        {rows.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{a.nameBn || a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[a.graduationYear, a.lastClass, a.currentJob, a.organization].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{a.phone || a.email}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
