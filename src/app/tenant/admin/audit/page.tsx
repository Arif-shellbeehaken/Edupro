import { AuditExportForm } from "./export-form";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  let tenantName = "প্রতিষ্ঠান";
  let logs: Awaited<ReturnType<typeof extendedRepository.listAudit>> = [];

  if (session.user.tenantId) {
    setTenantContext({ tenantId: session.user.tenantId, userId: session.user.id, role: session.user.role, isSuperAdmin: false });
    try {
      const t = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { name: true, nameBn: true } });
      if (t) tenantName = t.nameBn || t.name;
      logs = await extendedRepository.listAudit(session.user.tenantId);
    } catch { /* */ }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader title="অডিট লগ" subtitle="Enterprise activity trail" userName={session.user.name ?? "Admin"} userRole={session.user.role} tenantName={tenantName} />
        <div className="space-y-6 p-6">
          <AuditExportForm />
          <Card>
            <CardHeader>
              <CardTitle>সাম্প্রতিক অ্যাকশন</CardTitle>
              <CardDescription>CREATE / UPDATE / DELETE / LOGIN ট্রেইল</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  এখনো লগ নেই। ডোনেশন ইত্যাদি অ্যাকশনে অডিট এন্ট্রি তৈরি হয়।
                </p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">
                        {l.action}
                        {l.entityType ? ` · ${l.entityType}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.createdAt.toLocaleString("bn-BD")}
                        {l.userId ? ` · user ${l.userId.slice(0, 8)}…` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">{l.action}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
