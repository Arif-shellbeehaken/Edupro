import { GrievanceSlaForm } from "./sla-form";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GrievanceForms } from "./grievance-forms";

export default async function GrievancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  let tenantName = "প্রতিষ্ঠান";
  let items: Awaited<ReturnType<typeof extendedRepository.listGrievances>> = [];

  if (session.user.tenantId) {
    setTenantContext({ tenantId: session.user.tenantId, userId: session.user.id, role: session.user.role, isSuperAdmin: false });
    try {
      const t = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { name: true, nameBn: true } });
      if (t) tenantName = t.nameBn || t.name;
      items = await extendedRepository.listGrievances();
    } catch { /* */ }
  }

  const open = items.filter((g) => g.status === "OPEN" || g.status === "IN_PROGRESS").length;

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader title="অভিযোগ সেল" subtitle="Grievance tracking" userName={session.user.name ?? "Admin"} userRole={session.user.role} tenantName={tenantName} />
        <div className="space-y-6 p-6">
      <GrievanceSlaForm />
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ওপেন</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600">{open}</div></CardContent></Card>
          <GrievanceForms openItems={items.filter((g) => g.status !== "CLOSED" && g.status !== "RESOLVED").map((g) => ({ id: g.id, subject: g.subject, status: g.status }))} />
          <Card>
            <CardHeader><CardTitle>সব অভিযোগ</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <EmptyState title="কোনো অভিযোগ নেই" description="অভিযোগ এলে এখানে ট্র্যাক হবে" />
              ) : items.map((g) => (
                <div key={g.id} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <p className="font-medium">{g.subject}</p>
                    <Badge variant={g.status === "RESOLVED" || g.status === "CLOSED" ? "success" : "warning"}>{g.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{g.category} · {g.priority} · {g.submittedBy || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
