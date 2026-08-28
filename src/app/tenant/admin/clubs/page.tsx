import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { ModuleForm } from "./forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

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
  let students: {
    id: string;
    name: string;
    nameBn: string | null;
    studentId: string;
  }[] = [];
  try {
    rows = await extendedOpsRepository.listClubs();
    if (session?.user.tenantId) {
      students = await prisma.student.findMany({
        where: {
          tenantId: session.user.tenantId,
          deletedAt: null,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          nameBn: true,
          studentId: true,
        },
        orderBy: { name: "asc" },
        take: 200,
      });
    }
  } catch {
    /* empty */
  }

  return (
    <div className="page-pad">
      <div>
        <h1 className="page-title">ক্লাব ও এক্সট্রাকারিকুলার</h1>
        <p className="text-sm text-muted-foreground">
          ক্রীড়া · সাংস্কৃতিক · একাডেমিক · সদস্য SMS
        </p>
      </div>
      <ModuleForm
        clubs={rows.map((c) => ({
          id: c.id,
          name: c.name,
          nameBn: c.nameBn,
        }))}
        students={students}
      />
      <div className="space-y-2">
        {rows.length === 0 && (
          <EmptyState title="কোনো ক্লাব নেই" description="স্পোর্টস/এক্সট্রাকারিকুলার ক্লাব যোগ করুন" />
        )}
        {rows.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{c.nameBn || c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.coachName || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{c.category}</Badge>
                <span className="text-sm">
                  {c.members?.length ?? 0} সদস্য
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
