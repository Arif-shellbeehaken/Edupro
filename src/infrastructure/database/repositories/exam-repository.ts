import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const examRepository = {
  async listExams(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.exam.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { marks: true } },
      },
    });
  },

  async listSubjects(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.subject.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async createExam(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    examType: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.exam.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        examType: data.examType,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  },

  async createSubject(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    code?: string;
    fullMarks?: number;
    passMarks?: number;
  }) {
    return prisma.subject.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        code: data.code,
        fullMarks: data.fullMarks ?? 100,
        passMarks: data.passMarks ?? 33,
      },
    });
  },

  async upsertMark(data: {
    tenantId: string;
    examId: string;
    studentId: string;
    subjectId: string;
    marksObtained: number;
    fullMarks?: number;
    grade?: string;
    remarks?: string;
  }) {
    const full = data.fullMarks ?? 100;
    const pct = full > 0 ? (data.marksObtained / full) * 100 : 0;
    const grade =
      data.grade ??
      (pct >= 80
        ? "A+"
        : pct >= 70
          ? "A"
          : pct >= 60
            ? "B"
            : pct >= 50
              ? "C"
              : pct >= 33
                ? "D"
                : "F");

    return prisma.examMark.upsert({
      where: {
        examId_studentId_subjectId: {
          examId: data.examId,
          studentId: data.studentId,
          subjectId: data.subjectId,
        },
      },
      update: {
        marksObtained: data.marksObtained,
        fullMarks: full,
        grade,
        remarks: data.remarks,
      },
      create: {
        tenantId: data.tenantId,
        examId: data.examId,
        studentId: data.studentId,
        subjectId: data.subjectId,
        marksObtained: data.marksObtained,
        fullMarks: full,
        grade,
        remarks: data.remarks,
      },
    });
  },

  async listMarksForExam(examId: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.examMark.findMany({
      where: { examId, tenantId: tid },
      include: {
        subject: { select: { name: true, nameBn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  async listMarksGroupedByStudent(examId: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const marks = await prisma.examMark.findMany({
      where: { examId, tenantId: tid },
      include: {
        subject: { select: { id: true, name: true, nameBn: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const byStudent = new Map<string, typeof marks>();
    for (const m of marks) {
      const arr = byStudent.get(m.studentId) ?? [];
      arr.push(m);
      byStudent.set(m.studentId, arr);
    }
    return byStudent;
  },

  async getExam(examId: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.exam.findFirst({ where: { id: examId, tenantId: tid } });
  },
};
