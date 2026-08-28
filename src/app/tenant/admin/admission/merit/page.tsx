import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MeritForm } from "./merit-form";

export default async function MeritPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tid = session.user.tenantId;

  const leads = await prisma.admissionLead.findMany({
    where: { tenantId: tid, meritRank: { not: null } },
    orderBy: { meritRank: "asc" },
    take: 100,
  });

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <AppHeader
        title="মেধাতালিকা"
        subtitle="ভর্তি merit rank"
        userName={session.user.name ?? "Admin"}
        userRole={session.user.role}
      />
      <div className="space-y-6 p-6">
        <MeritForm />
        <Card>
          <CardHeader>
            <CardTitle>র‌্যাঙ্ক তালিকা</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                এখনো জেনারেট হয়নি
              </p>
            ) : (
              leads.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      #{l.meritRank} · {l.applicantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.applyingClass} · স্কোর {l.meritScore}
                    </p>
                  </div>
                  <Badge variant="secondary">{l.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
