import { UserRole } from "@/domain/enums";
import { ForbiddenError, UnauthorizedError } from "@/shared/errors";
import { auth } from "./auth";

/**
 * Role hierarchy helpers
 * Higher index = more privilege within institution
 */
const ROLE_LEVEL: Record<string, number> = {
  [UserRole.STUDENT]: 10,
  [UserRole.PARENT]: 20,
  [UserRole.LIBRARIAN]: 30,
  [UserRole.TRANSPORT_MANAGER]: 30,
  [UserRole.HOSTEL_WARDEN]: 30,
  [UserRole.TEACHER]: 40,
  [UserRole.HIFZ_TEACHER]: 40,
  [UserRole.MUHADDIS]: 40,
  [UserRole.ACCOUNTANT]: 50,
  [UserRole.PRINCIPAL]: 80,
  [UserRole.INSTITUTION_ADMIN]: 90,
  [UserRole.SUPER_ADMIN]: 100,
};

export function hasMinRole(userRole: string, minRole: UserRole): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 999);
}

export function isStaffRole(role: string): boolean {
  return [
    UserRole.TEACHER,
    UserRole.HIFZ_TEACHER,
    UserRole.MUHADDIS,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
    UserRole.HOSTEL_WARDEN,
    UserRole.TRANSPORT_MANAGER,
    UserRole.PRINCIPAL,
    UserRole.INSTITUTION_ADMIN,
  ].includes(role as UserRole);
}

/**
 * Server-side guard — use inside Server Components / Server Actions / Route Handlers
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const role = session.user.role as UserRole;

  if (session.user.isSuperAdmin) return session; // Super Admin bypasses role checks

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(`Required role: ${allowedRoles.join(" | ")}`);
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (!session.user.isSuperAdmin) {
    throw new ForbiddenError("Super Admin access required");
  }
  return session;
}

export async function requireTenantContext() {
  const session = await requireAuth();
  if (session.user.isSuperAdmin) {
    // Super Admin can operate without tenant, but many actions need explicit tenantId
    return session;
  }
  if (!session.user.tenantId) {
    throw new ForbiddenError("No tenant associated with this account");
  }
  return session;
}

/**
 * Get dashboard path based on role
 */
export function getDashboardPath(role: string, isSuperAdmin: boolean): string {
  if (isSuperAdmin) return "/super-admin/dashboard";

  switch (role) {
    case UserRole.INSTITUTION_ADMIN:
    case UserRole.PRINCIPAL:
    case UserRole.ACCOUNTANT:
      return "/tenant/admin/dashboard";
    case UserRole.TEACHER:
    case UserRole.HIFZ_TEACHER:
    case UserRole.MUHADDIS:
    case UserRole.MUHADDIS:
      return "/tenant/teacher";
    case UserRole.PARENT:
      return "/tenant/admin/dashboard"; // later: /tenant/parent/dashboard
    case UserRole.STUDENT:
      return "/tenant/admin/dashboard"; // later: /tenant/student/dashboard
    default:
      return "/tenant/admin/dashboard";
  }
}
