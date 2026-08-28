import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupportAdminForms } from "./support-forms";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/login");

  let tickets: {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    tenantId: string | null;
    assigneeNote: string | null;
    createdAt: Date;
  }[] = [];
  let tenantNames = new Map<string, string>();

  try {
    tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const tenantIds = [
      ...new Set(tickets.map((t) => t.tenantId).filter(Boolean) as string[]),
    ];
    if (tenantIds.length) {
      const ts = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true, nameBn: true },
      });
      tenantNames = new Map(
        ts.map((t) => [t.id, t.nameBn || t.name])
      );
    }
  } catch {
    /* db */
  }

  const open = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="সাপোর্ট টিকিট"
          subtitle="ক্লায়েন্ট সাপোর্ট"
          userName={session.user.name ?? "Super Admin"}
          userRole={session.user.role}
        />
        <div className="page-pad">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মোট</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">ওপেন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {
                    tickets.filter(
                      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <SupportAdminForms
            tickets={tickets.map((t) => ({
              id: t.id,
              subject: t.subject,
              description: t.description,
              category: t.category,
              priority: t.priority,
              status: t.status,
              tenantName: t.tenantId
                ? tenantNames.get(t.tenantId) || t.tenantId.slice(0, 8)
                : "Platform",
              assigneeNote: t.assigneeNote,
              createdAt: t.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
