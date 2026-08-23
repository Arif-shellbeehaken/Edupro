import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransportForms } from "./transport-forms";

export default async function TransportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let routes: Awaited<ReturnType<typeof operationsRepository.listRoutes>> = [];
  let assignments: Awaited<ReturnType<typeof operationsRepository.listAssignments>> = [];
  let students: { id: string; name: string; studentId: string }[] = [];

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
      routes = await operationsRepository.listRoutes();
      assignments = await operationsRepository.listAssignments();
      const s = await studentRepository.list({ status: "ACTIVE", take: 100 });
      students = s.map((x) => ({
        id: x.id,
        name: x.nameBn || x.name,
        studentId: x.studentId,
      }));
    } catch {
      /* db */
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        type="tenant"
        institutionName={tenantName}
        user={{
          name: session.user.name ?? "Admin",
          role: session.user.role,
          email: session.user.email ?? undefined,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ট্রান্সপোর্ট"
          subtitle="রুট · যানবাহন · শিক্ষার্থী অ্যাসাইন"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">রুট</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">অ্যাসাইনমেন্ট</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{assignments.length}</div>
              </CardContent>
            </Card>
          </div>

          <TransportForms
            routes={routes.map((r) => ({
              id: r.id,
              name: r.nameBn || r.name,
              assigned: r._count.assignments,
              capacity: r.capacity,
            }))}
            students={students}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>রুট তালিকা</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {routes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">কোনো রুট নেই</p>
                ) : (
                  routes.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{r.nameBn || r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.vehicleNo || "—"} · {r.driverName || "—"} · ৳{r.monthlyFee}/মাস
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {r._count.assignments}/{r.capacity}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>সক্রিয় অ্যাসাইনমেন্ট</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">কোনো অ্যাসাইনমেন্ট নেই</p>
                ) : (
                  assignments.map((a) => (
                    <div key={a.id} className="rounded-lg border px-3 py-2 text-sm">
                      শিক্ষার্থী {a.studentId.slice(0, 8)}… →{" "}
                      {a.route.nameBn || a.route.name}
                      {a.pickupPoint ? ` · পিকআপ: ${a.pickupPoint}` : ""}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
