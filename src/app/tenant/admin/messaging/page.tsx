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
import { EmptyState } from "@/components/ui/empty-state";
import { MessagingForm } from "./form";

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tid = session.user.tenantId;
  const sp = await searchParams;
  const threadKey = sp.thread || "general";

  const messages = await prisma.chatMessage.findMany({
    where: { tenantId: tid, threadKey },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <AppHeader
        title="মেসেজিং"
        subtitle="অভিভাবক–শিক্ষক থ্রেড"
        userName={session.user.name ?? "Admin"}
        userRole={session.user.role}
      />
      <div className="mx-auto max-w-2xl page-pad">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">থ্রেড: {threadKey}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-3">
              {messages.length === 0 ? (
                <EmptyState title="মেসেজ নেই" description="অভিভাবক-স্টাফ মেসেজ এখানে" />
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="font-medium">{m.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {m.senderRole} ·{" "}
                      {m.createdAt.toLocaleString("bn-BD")}
                    </span>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))
              )}
            </div>
            <MessagingForm threadKey={threadKey} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
