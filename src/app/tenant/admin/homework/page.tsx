import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { HomeworkForm } from "./homework-form";

export default async function HomeworkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  let tenantName = "প্রতিষ্ঠান";
  let items: Awaited<ReturnType<typeof extendedRepository.listHomework>> = [];
  let classes: { id: string; name: string; nameBn: string | null }[] = [];

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
      items = await extendedRepository.listHomework();
      classes = await prisma.class.findMany({
        where: { tenantId: session.user.tenantId, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, nameBn: true },
        take: 100,
      });
    } catch {
      /* */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="হোমওয়ার্ক / অ্যাসাইনমেন্ট"
          subtitle="LMS · অভিভাবক রিমাইন্ডার"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <HomeworkForm
            classes={classes}
            homeworks={items.map((h) => ({
              id: h.id,
              title: h.title,
              status: h.status,
            }))}
          />
          <Card>
            <CardHeader>
              <CardTitle>অ্যাসাইনমেন্ট তালিকা</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <EmptyState title="কোনো হোমওয়ার্ক নেই" />
              ) : (
                items.map((h) => (
                  <div
                    key={h.id}
                    className="flex justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.subjectName || "—"}
                        {h.classId ? ` · class ${h.classId.slice(0, 6)}…` : ""}
                        {h.dueDate
                          ? ` · ডিউ ${h.dueDate.toLocaleDateString("bn-BD")}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant={h.status === "ACTIVE" ? "success" : "secondary"}
                    >
                      {h.status}
                    </Badge>
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
