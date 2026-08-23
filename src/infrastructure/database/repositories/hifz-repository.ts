import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";
import type { CreateHifzEntryInput } from "@/domain/entities/hifz";
import { pageToJuz } from "@/domain/entities/hifz";

/**
 * Hifz Repository — all queries scoped by tenant_id
 */
export const hifzRepository = {
  async listStudentsWithProgress(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.student.findMany({
      where: {
        tenantId: tid,
        isHifzStudent: true,
        deletedAt: null,
        status: "ACTIVE",
      },
      include: {
        hifzProgress: true,
        currentClass: { select: { name: true, nameBn: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async getStudentProgress(studentId: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.hifzProgress.findFirst({
      where: { studentId, tenantId: tid },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            currentJuz: true,
            currentPage: true,
          },
        },
      },
    });
  },

  async listEntries(
    studentId: string,
    options?: { limit?: number; stream?: string; tenantId?: string }
  ) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.hifzEntry.findMany({
      where: {
        tenantId: tid,
        studentId,
        ...(options?.stream ? { stream: options.stream } : {}),
      },
      orderBy: { date: "desc" },
      take: options?.limit ?? 30,
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });
  },

  async createEntry(input: CreateHifzEntryInput) {
    const tid = input.tenantId;

    const entry = await prisma.hifzEntry.create({
      data: {
        tenantId: tid,
        studentId: input.studentId,
        teacherId: input.teacherId,
        date: input.date,
        stream: input.stream,
        fromJuz: input.fromJuz,
        fromPage: input.fromPage,
        fromSurah: input.fromSurah,
        toJuz: input.toJuz,
        toPage: input.toPage,
        toSurah: input.toSurah,
        quality: input.quality,
        mistakesCount: input.mistakesCount,
        teacherNote: input.teacherNote,
      },
    });

    // Update aggregate progress for SABAK (new memorization)
    if (input.stream === "SABAK") {
      const qualityScore: Record<string, number> = {
        EXCELLENT: 5,
        GOOD: 4,
        AVERAGE: 3,
        NEEDS_WORK: 2,
        WEAK: 1,
      };
      const score = qualityScore[input.quality] ?? 3;

      const existing = await prisma.hifzProgress.findUnique({
        where: { studentId: input.studentId },
      });

      if (existing) {
        const pagesAdded = Math.max(0, input.toPage - input.fromPage + 1);
        const newAvg =
          existing.averageQualityScore === 0
            ? score
            : (existing.averageQualityScore * 0.8 + score * 0.2);

        await prisma.hifzProgress.update({
          where: { studentId: input.studentId },
          data: {
            currentJuz: input.toJuz,
            currentPage: input.toPage,
            currentSurah: input.toSurah,
            totalPagesMemorized: existing.totalPagesMemorized + pagesAdded,
            totalJuzCompleted: pageToJuz(input.toPage) - 1,
            averageQualityScore: Math.round(newAvg * 100) / 100,
            lastEntryDate: input.date,
          },
        });

        await prisma.student.update({
          where: { id: input.studentId },
          data: {
            currentJuz: input.toJuz,
            currentPage: input.toPage,
          },
        });
      } else {
        await prisma.hifzProgress.create({
          data: {
            tenantId: tid,
            studentId: input.studentId,
            currentJuz: input.toJuz,
            currentPage: input.toPage,
            currentSurah: input.toSurah,
            totalPagesMemorized: Math.max(0, input.toPage - input.fromPage + 1),
            totalJuzCompleted: Math.max(0, pageToJuz(input.toPage) - 1),
            averageQualityScore: score,
            lastEntryDate: input.date,
          },
        });
      }
    }

    return entry;
  },
};
