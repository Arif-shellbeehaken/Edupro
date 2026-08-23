import { prisma } from "@/infrastructure/database/prisma";
import type { CreateTenantInput } from "@/domain/entities/tenant";
import { hashPassword } from "@/infrastructure/auth/password";
import { ConflictError } from "@/shared/errors";

/**
 * Tenant Repository — Super Admin only operations
 */
export const tenantRepository = {
  async listAll(options?: { status?: string; take?: number }) {
    return prisma.tenant.findMany({
      where: {
        deletedAt: null,
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.take ?? 50,
      include: {
        _count: { select: { students: true, users: true } },
      },
    });
  },

  async findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, users: true } },
      },
    });
  },

  /**
   * Provision a new tenant + admin user + current academic year
   * Runs in a transaction for consistency.
   */
  async provision(input: CreateTenantInput) {
    const existing = await prisma.tenant.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new ConflictError(`Slug "${input.slug}" ইতিমধ্যে ব্যবহৃত হয়েছে`);
    }

    const emailTaken = await prisma.user.findFirst({
      where: { email: input.adminEmail.toLowerCase().trim() },
    });
    if (emailTaken) {
      throw new ConflictError(`ইমেইল ${input.adminEmail} ইতিমধ্যে ব্যবহৃত`);
    }

    const passwordHash = await hashPassword(input.adminPassword);
    const plan = input.plan ?? "BASIC";
    const limits: Record<string, { maxStudents: number; maxStaff: number }> = {
      BASIC: { maxStudents: 500, maxStaff: 30 },
      STANDARD: { maxStudents: 1500, maxStaff: 80 },
      PREMIUM: { maxStudents: 5000, maxStaff: 200 },
      ENTERPRISE: { maxStudents: 50000, maxStaff: 1000 },
    };
    const limit = limits[plan] ?? limits.BASIC;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          nameBn: input.nameBn,
          slug: input.slug.toLowerCase().trim(),
          type: input.type,
          status: "TRIAL",
          plan,
          email: input.email,
          phone: input.phone,
          address: input.address,
          district: input.district,
          division: input.division,
          maxStudents: limit.maxStudents,
          maxStaff: limit.maxStaff,
          trialEndsAt,
          boardAffiliation: "[]",
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.adminEmail.toLowerCase().trim(),
          phone: input.adminPhone,
          passwordHash,
          name: input.adminName,
          role: "INSTITUTION_ADMIN",
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });

      const year = new Date().getFullYear();
      await tx.academicYear.create({
        data: {
          tenantId: tenant.id,
          name: `${year}-${year + 1}`,
          nameBn: `${year}-${year + 1}`,
          startDate: new Date(`${year}-01-01`),
          endDate: new Date(`${year}-12-31`),
          isCurrent: true,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "TENANT_PROVISIONED",
          entityType: "Tenant",
          entityId: tenant.id,
          newValues: {
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            adminEmail: admin.email,
          },
        },
      });

      return { tenant, admin };
    });
  },
};
