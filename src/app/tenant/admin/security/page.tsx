import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TwoFactorForms } from "./two-factor-forms";

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let twoFactorEnabled = false;
  let hasSecret = false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    twoFactorEnabled = user?.twoFactorEnabled ?? false;
    hasSecret = !!user?.twoFactorSecret;
    if (session.user.tenantId) {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
    }
  } catch { /* */ }

  const smsProvider = process.env.SMS_PROVIDER || "console";

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
          title="সিকিউরিটি"
          subtitle="2FA · SMS provider"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant={twoFactorEnabled ? "success" : "warning"}>
              2FA: {twoFactorEnabled ? "ON" : "OFF"}
            </Badge>
            <Badge variant="secondary">SMS: {smsProvider}</Badge>
          </div>

          <TwoFactorForms enabled={twoFactorEnabled} hasSecret={hasSecret} />

          <Card>
            <CardHeader>
              <CardTitle>SMS Provider</CardTitle>
              <CardDescription>
                Env: SMS_PROVIDER=console|sslwireless|http · SMS_API_KEY · SMS_SENDER_ID · SMS_API_ENDPOINT
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>বর্তমান: <strong>{smsProvider}</strong></p>
              <p>
                Communication মডিউল থেকে SMS পাঠালে provider দিয়ে যাবে এবং MessageLog-এ SENT/FAILED স্ট্যাটাস থাকবে।
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
