import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";
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
import { CommunicationForms } from "./communication-forms";

export default async function CommunicationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let messages: Awaited<ReturnType<typeof communicationRepository.listMessages>> = [];
  let notices: Awaited<ReturnType<typeof communicationRepository.listNotices>> = [];
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
      messages = await communicationRepository.listMessages();
      notices = await communicationRepository.listNotices();
      classes = await prisma.class.findMany({
        where: { tenantId: session.user.tenantId, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, nameBn: true },
        take: 100,
      });
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="যোগাযোগ"
          subtitle="SMS · নোটিশ · মেসেজ লগ"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="page-pad">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মেসেজ লগ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messages.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">নোটিশ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{notices.length}</div>
              </CardContent>
            </Card>
          </div>

          <CommunicationForms classes={classes} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>সাম্প্রতিক মেসেজ</CardTitle>
                <CardDescription>
                  প্রোডাকশনে SSL Wireless / Twilio / Meta WhatsApp প্লাগ-ইন হবে
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {messages.length === 0 ? (
                  <EmptyState title="কোনো মেসেজ নেই" description="SMS/নোটিফিকেশন লগ এখানে দেখাবে" />
                ) : (
                  messages.slice(0, 15).map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {m.channel} → {m.recipient}
                        </span>
                        <Badge variant={m.status === "SENT" ? "success" : "warning"}>
                          {m.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {m.body}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>নোটিশ বোর্ড</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notices.length === 0 ? (
                  <EmptyState title="কোনো নোটিশ নেই" description="প্রথম নোটিশ প্রকাশ করুন" />
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="rounded-lg border px-3 py-2 text-sm">
                      <p className="font-medium">{n.titleBn || n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.audience} ·{" "}
                        {n.publishedAt.toLocaleDateString("bn-BD")}
                      </p>
                      <p className="mt-1 text-xs line-clamp-2">{n.body}</p>
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
