import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const timetableRepository = {
  async listSlots(options?: { tenantId?: string; classId?: string }) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.timetableSlot.findMany({
      where: {
        tenantId: tid,
        ...(options?.classId ? { classId: options.classId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, nameBn: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { periodNo: "asc" }],
    });
  },

  async upsertSlot(data: {
    tenantId: string;
    classId?: string;
    dayOfWeek: number;
    periodNo: number;
    startTime: string;
    endTime: string;
    subjectId?: string;
    teacherId?: string;
    room?: string;
  }) {
    return prisma.timetableSlot.upsert({
      where: {
        tenantId_classId_dayOfWeek_periodNo: {
          tenantId: data.tenantId,
          classId: data.classId ?? "",
          dayOfWeek: data.dayOfWeek,
          periodNo: data.periodNo,
        },
      },
      update: {
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        room: data.room,
      },
      create: {
        tenantId: data.tenantId,
        classId: data.classId ?? "",
        dayOfWeek: data.dayOfWeek,
        periodNo: data.periodNo,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        room: data.room,
      },
    });
  },
};

export const DAY_NAMES_BN = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];
