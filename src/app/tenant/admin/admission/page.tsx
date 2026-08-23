import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { crmRepository } from "@/infrastructure/database/repositories/crm-repository";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdmissionForms } from "./admission-forms";

const STATUS_LABEL: Record<string, string> = {
  NEW: "নতুন",
  CONTACTED: "যোগাযোগ",
  VISIT_SCHEDULED: "ভিজিট নির্ধারিত",
  DOCUMENTS: "ডকুমেন্ট",
  ADMITTED: "ভর্তি",
  REJECTED: "বাতিল",
  LOST: "হারিয়েছে",
};

const PIPELINE = ["NEW", "CONTACTED", "VISIT_SCHEDULED", "DOCUMENTS", "ADMITTED"];

export default async function AdmissionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let leads: Awaited<ReturnType<typeof crmRepository.listLeads>> = [];
  let pipeline: Record<string, number> = {};

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
      leads = await crmRepository.listLeads({ take: 50 });
      pipeline = await crmRepository.pipelineSummary();
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
          title="ভর্তি CRM"
          subtitle="লিড · পাইপলাইন · ফলো-আপ"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-5">
            {PIPELINE.map((s) => (
              <Card key={s}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">
                    {STATUS_LABEL[s]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{pipeline[s] ?? 0}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <AdmissionForms
            leads={leads.map((l) => ({
              id: l.id,
              name: l.applicantNameBn || l.applicantName,
              phone: l.phone,
              status: l.status,
              applyingClass: l.applyingClass,
              source: l.source,
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle>সব লিড</CardTitle>
              <CardDescription>আবেদনকারী তালিকা</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {leads.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো লিড নেই</p>
              ) : (
                leads.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {l.applicantNameBn || l.applicantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.phone}
                        {l.applyingClass ? ` · ${l.applyingClass}` : ""}
                        {l.source ? ` · ${l.source}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        l.status === "ADMITTED"
                          ? "success"
                          : l.status === "REJECTED" || l.status === "LOST"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {STATUS_LABEL[l.status] ?? l.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
