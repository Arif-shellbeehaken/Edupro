import { requireSuperAdmin } from "@/infrastructure/auth/session";
import { AppShell, PageBody } from "@/components/layout/app-shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSuperAdmin();

  return (
    <AppShell
      type="super-admin"
      user={{
        name: session.user.name ?? "Super Admin",
        role: session.user.role,
        email: session.user.email ?? undefined,
      }}
    >
      <PageBody>{children}</PageBody>
    </AppShell>
  );
}
