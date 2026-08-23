import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
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
import { SettingsForm } from "./settings-form";
import { BrandingForm } from "./branding-form";
import { SupportTicketForm } from "./support-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let tenant: {
    name: string;
    nameBn: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    type: string;
    plan: string;
    status: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  } | null = null;

  if (session.user.tenantId) {
    try {
      tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: {
          name: true,
          nameBn: true,
          email: true,
          phone: true,
          address: true,
          type: true,
          plan: true,
          status: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });
      if (tenant) tenantName = tenant.nameBn || tenant.name;
    } catch {
      /* db */
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        type="tenant"
        institutionName={tenantName}
        primaryColor={tenant?.primaryColor}
        logoUrl={tenant?.logoUrl}
        user={{
          name: session.user.name ?? "Admin",
          role: session.user.role,

          email: session.user.email ?? undefined,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="সেটিংস"
          subtitle="প্রতিষ্ঠানের তথ্য ও সাবস্ক্রিপশন"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          {tenant && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Plan: {tenant.plan}</Badge>
              <Badge variant={tenant.status === "ACTIVE" ? "success" : "warning"}>
                {tenant.status}
              </Badge>
              <Badge variant="secondary">Slug: {tenant.slug}</Badge>
              <Badge variant="secondary">Type: {tenant.type}</Badge>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>প্রতিষ্ঠানের তথ্য</CardTitle>
              <CardDescription>নাম, যোগাযোগ, ঠিকানা আপডেট করুন</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant ? (
                <SettingsForm
                  defaults={{
                    name: tenant.name,
                    nameBn: tenant.nameBn ?? "",
                    email: tenant.email ?? "",
                    phone: tenant.phone ?? "",
                    address: tenant.address ?? "",
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">টেনান্ট লোড হয়নি</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>White-label ব্র্যান্ডিং</CardTitle>
              <CardDescription>লোগো URL · প্রাইমারি/সেকেন্ডারি রঙ</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant ? (
                <BrandingForm
                  defaults={{
                    logoUrl: tenant.logoUrl ?? "",
                    primaryColor: tenant.primaryColor ?? "#059669",
                    secondaryColor: tenant.secondaryColor ?? "#0f766e",
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">টেনান্ট লোড হয়নি</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>সাপোর্ট টিকিট</CardTitle>
              <CardDescription>
                প্ল্যাটফর্ম সাপোর্টে রিকোয়েস্ট — Super Admin কিউতে যাবে
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportTicketForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
