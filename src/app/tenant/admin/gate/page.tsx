import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GateForms } from "./gate-forms";

export default async function GatePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  let tenantName = "প্রতিষ্ঠান";
  let visitors: Awaited<ReturnType<typeof extendedRepository.listVisitors>> = [];

  if (session.user.tenantId) {
    setTenantContext({ tenantId: session.user.tenantId, userId: session.user.id, role: session.user.role, isSuperAdmin: false });
    try {
      const t = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { name: true, nameBn: true } });
      if (t) tenantName = t.nameBn || t.name;
      visitors = await extendedRepository.listVisitors();
    } catch { /* */ }
  }

  const inside = visitors.filter((v) => v.status === "IN").length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar type="tenant" institutionName={tenantName} user={{ name: session.user.name ?? "Admin", role: session.user.role, email: session.user.email ?? undefined }} />
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader title="গেট / ভিজিটর" subtitle="চেক-ইন · চেক-আউট" userName={session.user.name ?? "Admin"} userRole={session.user.role} tenantName={tenantName} />
        <div className="space-y-6 p-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">এখন ভিতরে</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{inside}</div></CardContent></Card>
          <GateForms insideVisitors={visitors.filter((v) => v.status === "IN").map((v) => ({ id: v.id, name: v.visitorName, purpose: v.purpose }))} />
          <Card>
            <CardHeader><CardTitle>লগ</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {visitors.length === 0 ? <p className="text-sm text-muted-foreground">কোনো লগ নেই</p> : visitors.map((v) => (
                <div key={v.id} className="flex justify-between rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{v.visitorName}</p>
                    <p className="text-xs text-muted-foreground">{v.purpose || "—"} · {v.checkInAt.toLocaleString("bn-BD")}</p>
                  </div>
                  <Badge variant={v.status === "IN" ? "warning" : "secondary"}>{v.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
