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
};
