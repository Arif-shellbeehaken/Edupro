import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";
import type { CreateStudentInput } from "@/domain/entities/student";
import { ConflictError } from "@/shared/errors";

export const studentRepository = {
  async list(options?: {
    tenantId?: string;
    status?: string;
    classId?: string;
    search?: string;
    take?: number;
  }) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.student.findMany({
      where: {
        tenantId: tid,
        deletedAt: null,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.classId ? { currentClassId: options.classId } : {}),
        ...(options?.search
          ? {
              OR: [
                { name: { contains: options.search } },
                { nameBn: { contains: options.search } },
                { studentId: { contains: options.search } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: options?.take ?? 100,
      include: {
        currentClass: { select: { id: true, name: true, nameBn: true } },
        currentSection: { select: { id: true, name: true } },
        hifzProgress: true,
      },
    });
  },

  async findById(id: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.student.findFirst({
      where: { id, tenantId: tid, deletedAt: null },
      include: {
        currentClass: true,
        currentSection: true,
        hifzProgress: true,
      },
    });
  },

  async create(input: CreateStudentInput) {
    const tid = input.tenantId;
    const exists = await prisma.student.findUnique({
      where: {
        tenantId_studentId: { tenantId: tid, studentId: input.studentId },
      },
    });
    if (exists) {
      throw new ConflictError(`স্টুডেন্ট আইডি ${input.studentId} ইতিমধ্যে আছে`);
    }

    return prisma.student.create({
      data: {
        tenantId: tid,
        studentId: input.studentId,
        name: input.name,
        nameBn: input.nameBn,
        nameAr: input.nameAr,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
        currentClassId: input.currentClassId,
        currentSectionId: input.currentSectionId,
        fatherName: input.fatherName,
        fatherPhone: input.fatherPhone,
        motherName: input.motherName,
        guardianPhone: input.guardianPhone,
        isHifzStudent: input.isHifzStudent ?? false,
        status: "ACTIVE",
        admissionDate: new Date(),
      },
    });
  },

  async countByTenant(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.student.count({
      where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
    });
  },


  /**
   * Promote students from one class to another (batch).
   * Clears section assignment (sections are class-scoped).
   * Optionally updates academicYearId from the target class.
   */
  async promoteBatch(data: {
    tenantId: string;
    fromClassId: string;
    toClassId: string;
    studentIds?: string[]; // if omitted, all ACTIVE in fromClass
    toSectionId?: string | null;
  }) {
    const tid = data.tenantId;

    const [fromClass, toClass] = await Promise.all([
      prisma.class.findFirst({
        where: { id: data.fromClassId, tenantId: tid, deletedAt: null },
      }),
      prisma.class.findFirst({
        where: { id: data.toClassId, tenantId: tid, deletedAt: null },
        include: { sections: true },
      }),
    ]);
    if (!fromClass) throw new Error("Source class not found");
    if (!toClass) throw new Error("Target class not found");
    if (data.fromClassId === data.toClassId) {
      throw new Error("Source and target class must differ");
    }

    let toSectionId: string | null = data.toSectionId ?? null;
    if (toSectionId) {
      const ok = toClass.sections.some((s) => s.id === toSectionId);
      if (!ok) throw new Error("Section does not belong to target class");
    }

    const where = {
      tenantId: tid,
      deletedAt: null,
      status: "ACTIVE" as const,
      currentClassId: data.fromClassId,
      ...(data.studentIds?.length
        ? { id: { in: data.studentIds } }
        : {}),
    };

    const count = await prisma.student.count({ where });
    if (count === 0) return { promoted: 0, fromClass, toClass };

    await prisma.student.updateMany({
      where,
      data: {
        currentClassId: data.toClassId,
        currentSectionId: toSectionId,
        academicYearId: toClass.academicYearId,
      },
    });

    return { promoted: count, fromClass, toClass };
  },

  /** Move students back (or sideways) — same rules as promote, explicit name for UI. */
  async demoteBatch(data: {
    tenantId: string;
    fromClassId: string;
    toClassId: string;
    studentIds?: string[];
    toSectionId?: string | null;
  }) {
    return studentRepository.promoteBatch(data);
  },
};

