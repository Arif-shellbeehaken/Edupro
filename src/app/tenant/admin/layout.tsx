import { redirect } from "next/navigation";
import { requireTenantSession } from "@/infrastructure/auth/session";
import { getTenantBranding } from "@/lib/tenant-branding";
import { AppShell, PageBody } from "@/components/layout/app-shell";

export default async function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTenantSession();
  const branding = await getTenantBranding(session.user.tenantId);
  const institutionName = branding.nameBn || branding.name;

  return (
    <AppShell
      type="tenant"
      institutionName={institutionName}
      primaryColor={branding.primaryColor}
      logoUrl={branding.logoUrl}
      user={{
        name: session.user.name ?? "Admin",
        role: session.user.role,
        email: session.user.email ?? undefined,
      }}
    >
      <PageBody>{children}</PageBody>
    </AppShell>
  );
}
