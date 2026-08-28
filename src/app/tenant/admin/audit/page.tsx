import { AuditExportForm } from "./export-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableScroll } from "@/components/ui/table-scroll";
import { Button } from "@/components/ui/button";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityType?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;
  const action = (sp.action || "").trim();
  const entityType = (sp.entityType || "").trim();
  const q = (sp.q || "").trim();

  let tenantName = "প্রতিষ্ঠান";
  let logs: Awaited<ReturnType<typeof extendedRepository.listAudit>> = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
      logs = await extendedRepository.listAudit(session.user.tenantId, 80, {
        action: action || undefined,
        entityType: entityType || undefined,
        q: q || undefined,
      });
    } catch {
      /* */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="অডিট লগ"
          subtitle="Enterprise activity trail"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <AuditExportForm />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ফিল্টার</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-wrap items-end gap-2" method="get">
                <input
                  name="action"
                  defaultValue={action}
                  placeholder="Action (LOGIN, CREATE…)"
                  className="flex h-10 rounded-lg border px-3 text-sm"
                />
                <input
                  name="entityType"
                  defaultValue={entityType}
                  placeholder="Entity (Student, Invoice…)"
                  className="flex h-10 rounded-lg border px-3 text-sm"
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="খুঁজুন…"
                  className="flex h-10 rounded-lg border px-3 text-sm"
                />
                <Button type="submit" size="sm">
                  ফিল্টার
                </Button>
                {(action || entityType || q) && (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href="/tenant/admin/audit">রিসেট</Link>
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>সাম্প্রতিক অ্যাকশন</CardTitle>
              <CardDescription>
                {logs.length} এন্ট্রি
                {action ? ` · action=${action}` : ""}
                {entityType ? ` · entity=${entityType}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.length === 0 ? (
                <EmptyState title="অডিট লগ খালি" description="অ্যাকশন হলে ট্রেইল এখানে জমবে" />
              ) : (
                logs.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {l.action}
                        {l.entityType ? ` · ${l.entityType}` : ""}
                        {l.entityId ? (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            #{l.entityId.slice(0, 8)}
                          </span>
                        ) : null}
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
