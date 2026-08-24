import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";

/**
 * Server-side session guards — single source for route protection
 * beyond middleware (layouts + server actions).
 */

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.user.isSuperAdmin) redirect("/login");
  return session;
}

export async function requireTenantSession() {
  const session = await requireSession();
  if (session.user.isSuperAdmin) redirect("/super-admin/dashboard");
  if (!session.user.tenantId) redirect("/login");

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  return session;
}
