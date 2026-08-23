import { prisma } from "@/infrastructure/database/prisma";

export type TenantBranding = {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  name: string;
  nameBn: string | null;
  onboardingDone: boolean;
};

const DEFAULT: TenantBranding = {
  primaryColor: "#059669",
  secondaryColor: "#0f766e",
  logoUrl: null,
  name: "প্রতিষ্ঠান",
  nameBn: null,
  onboardingDone: true,
};

/**
 * Load white-label branding for a tenant.
 * onboardingDone is inferred: has at least 1 academic year OR student OR class.
 */
export async function getTenantBranding(
  tenantId: string | null | undefined
): Promise<TenantBranding> {
  if (!tenantId) return DEFAULT;
  try {
    const t = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        nameBn: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
      },
    });
    if (!t) return DEFAULT;

    const [years, classes, students] = await Promise.all([
      prisma.academicYear.count({ where: { tenantId } }).catch(() => 0),
      prisma.class.count({ where: { tenantId } }).catch(() => 0),
      prisma.student.count({ where: { tenantId, deletedAt: null } }).catch(() => 0),
    ]);

    return {
      primaryColor: t.primaryColor || DEFAULT.primaryColor,
      secondaryColor: t.secondaryColor || DEFAULT.secondaryColor,
      logoUrl: t.logoUrl,
      name: t.name,
      nameBn: t.nameBn,
      onboardingDone: years + classes + students > 0,
    };
  } catch {
    return DEFAULT;
  }
}
