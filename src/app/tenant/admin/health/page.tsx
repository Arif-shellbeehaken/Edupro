import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";

export default async function HealthPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let records: Awaited<ReturnType<typeof extendedOpsRepository.listHealth>> = [];
  let students: { id: string; name: string; nameBn: string | null }[] = [];
  try {
    records = await extendedOpsRepository.listHealth();
    const list = await studentRepository.list({ take: 200 });
    students = list.map((s) => ({ id: s.id, name: s.name, nameBn: s.nameBn }));
  } catch { /* empty */ }
  return (
    <div className="page-pad">
      <div>
        <h1 className="text-2xl font-semibold">স্বাস্থ্য ও ক্লিনিক</h1>
        <p className="text-sm text-muted-foreground">অ্যালার্জি · টিকা · ভিজিট লগ</p>
      </div>
      <ModuleForm students={students} />
      <div className="space-y-2">
        {records.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-3">
              <p className="text-sm font-medium">Student: {r.studentId}</p>
              <p className="text-xs text-muted-foreground">
                {[r.bloodGroup, r.allergies, r.chronicConditions, r.emergencyContact]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {r.lastVisitNote && <p className="mt-1 text-sm">{r.lastVisitNote}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
