import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

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
  } catch {
    /* empty */
  }
  const nameById = Object.fromEntries(
    students.map((s) => [s.id, s.nameBn || s.name])
  );

  return (
    <div className="page-pad">
      <div>
        <h1 className="text-2xl font-semibold">স্বাস্থ্য ও ক্লিনিক</h1>
        <p className="text-sm text-muted-foreground">
          অ্যালার্জি · ক্রনিক · টিকা · ইমার্জেন্সি কন্টাক্ট · ভিজিট নোট · অভিভাবক SMS
        </p>
      </div>
      <ModuleForm students={students} />
      <div className="space-y-2">
        {records.length === 0 ? (
          <EmptyState
            title="কোনো স্বাস্থ্য রেকর্ড নেই"
            description="শিক্ষার্থী নির্বাচন করে অ্যালার্জি/টিকা/ভিজিট সংরক্ষণ করুন"
          />
        ) : (
          records.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-1 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {nameById[r.studentId] || r.studentId}
                  </p>
                  {r.bloodGroup && (
                    <Badge variant="secondary">{r.bloodGroup}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[
                    r.allergies ? `অ্যালার্জি: ${r.allergies}` : null,
                    r.chronicConditions
                      ? `ক্রনিক: ${r.chronicConditions}`
                      : null,
                    r.emergencyContact
                      ? `জরুরি: ${r.emergencyContact}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {r.vaccinations && (
                  <p className="text-xs">টিকা: {r.vaccinations}</p>
                )}
                {r.lastVisitNote && (
                  <p className="mt-1 text-sm border-t border-border pt-2">
                    {r.lastVisitNote}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
