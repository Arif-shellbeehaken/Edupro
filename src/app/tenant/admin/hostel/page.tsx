import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
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
import { HostelForms } from "./hostel-forms";

export default async function HostelPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let rooms: Awaited<ReturnType<typeof operationsRepository.listRooms>> = [];
  let allocations: Awaited<ReturnType<typeof operationsRepository.listAllocations>> = [];
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
      rooms = await operationsRepository.listRooms();
      allocations = await operationsRepository.listAllocations();
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

  const totalCap = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOcc = rooms.reduce((s, r) => s + r.occupied, 0);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="হোস্টেল / আবাসিক"
          subtitle="রুম · অ্যালোকেশন · ফি"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">রুম</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rooms.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">অকুপেন্সি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalOcc}/{totalCap}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">সক্রিয় অ্যালোকেশন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{allocations.length}</div>
              </CardContent>
            </Card>
          </div>

          <HostelForms
            rooms={rooms
              .filter((r) => r.occupied < r.capacity)
              .map((r) => ({
                id: r.id,
                label: `${r.blockName ? r.blockName + "-" : ""}${r.roomNumber} (${r.occupied}/${r.capacity})`,
              }))}
            students={students}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>রুম তালিকা</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rooms.length === 0 ? (
                  <EmptyState
                    title="কোনো রুম নেই"
                    description="হোস্টেল রুম যোগ করে অ্যালোকেশন শুরু করুন"
                  />
                ) : (
                  rooms.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>
                        {r.blockName ? `${r.blockName} · ` : ""}
                        {r.roomNumber} · ৳{r.monthlyFee}/মাস
                      </span>
                      <Badge variant={r.occupied >= r.capacity ? "secondary" : "success"}>
                        {r.occupied}/{r.capacity}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>সক্রিয় অ্যালোকেশন</CardTitle>
                <CardDescription>শিক্ষার্থী → রুম</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {allocations.length === 0 ? (
                  <EmptyState
                    title="কোনো অ্যালোকেশন নেই"
                    description="শিক্ষার্থীকে রুমে বরাদ্দ করুন"
                  />
                ) : (
                  allocations.map((a) => (
                    <div key={a.id} className="rounded-lg border px-3 py-2 text-sm">
                      শিক্ষার্থী ID: {a.studentId.slice(0, 8)}… → রুম{" "}
                      {a.room.blockName ? `${a.room.blockName}-` : ""}
                      {a.room.roomNumber}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
