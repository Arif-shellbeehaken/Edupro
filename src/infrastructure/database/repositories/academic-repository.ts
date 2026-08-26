import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const academicRepository = {
  async listYears(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.academicYear.findMany({
      where: { tenantId: tid },
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { classes: true, students: true } },
      },
    });
  },

  async listClasses(academicYearId: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.class.findMany({
      where: { tenantId: tid, academicYearId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
        _count: { select: { students: true } },
      },
    });
  },

  async createYear(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    startDate: Date;
    endDate: Date;
    setCurrent?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      if (data.setCurrent) {
        await tx.academicYear.updateMany({
          where: { tenantId: data.tenantId, isCurrent: true },
          data: { isCurrent: false },
        });
      }
      return tx.academicYear.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          nameBn: data.nameBn,
          startDate: data.startDate,
          endDate: data.endDate,
          isCurrent: data.setCurrent ?? false,
        },
      });
    });
  },

  async setCurrentYear(tenantId: string, yearId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { tenantId, isCurrent: true },
        data: { isCurrent: false },
      });
      return tx.academicYear.update({
        where: { id: yearId },
        data: { isCurrent: true },
      });
    });
  },

  /**
   * Clone classes (+ sections) from source year into target year.
   * Does not move students. Returns map of oldClassId -> newClassId.
   */
  async cloneClasses(data: {
    tenantId: string;
    fromYearId: string;
    toYearId: string;
  }) {
    const classes = await prisma.class.findMany({
      where: {
        tenantId: data.tenantId,
        academicYearId: data.fromYearId,
        deletedAt: null,
      },
      include: { sections: true },
      orderBy: { sortOrder: "asc" },
    });

    const map = new Map<string, string>();

    for (const c of classes) {
      const existing = await prisma.class.findFirst({
        where: {
          tenantId: data.tenantId,
          academicYearId: data.toYearId,
          name: c.name,
          deletedAt: null,
        },
      });
      if (existing) {
        map.set(c.id, existing.id);
        continue;
      }
      const created = await prisma.class.create({
        data: {
          tenantId: data.tenantId,
          academicYearId: data.toYearId,
          name: c.name,
          nameBn: c.nameBn,
          nameAr: c.nameAr,
          code: c.code,
          capacity: c.capacity,
          sortOrder: c.sortOrder,
          board: c.board,
          level: c.level,
          sections: {
            create: c.sections.map((s) => ({
              tenantId: data.tenantId,
              name: s.name,
              capacity: s.capacity,
              sortOrder: s.sortOrder,
            })),
          },
        },
      });
      map.set(c.id, created.id);
    }

    return { cloned: map.size, classMap: Object.fromEntries(map) };
  },

  /**
   * Move ACTIVE students from source-year classes into cloned target-year
   * classes matched by the classMap (old -> new). Clears section.
   */
  async migrateStudentsToYear(data: {
    tenantId: string;
    fromYearId: string;
    toYearId: string;
    classMap: Record<string, string>;
  }) {
    let moved = 0;
    for (const [fromClassId, toClassId] of Object.entries(data.classMap)) {
      const res = await prisma.student.updateMany({
        where: {
          tenantId: data.tenantId,
          deletedAt: null,
          status: "ACTIVE",
          currentClassId: fromClassId,
        },
        data: {
          currentClassId: toClassId,
          currentSectionId: null,
          academicYearId: data.toYearId,
        },
      });
      moved += res.count;
    }
    return { moved };
  },
};
