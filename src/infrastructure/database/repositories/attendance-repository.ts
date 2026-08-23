import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export type MarkAttendanceInput = {
  tenantId: string;
  studentId: string;
  date: Date;
  status: string;
  period?: string;
  remarks?: string;
  markedById?: string;
};

export const attendanceRepository = {
  async listByDate(date: Date, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return prisma.attendance.findMany({
      where: {
        tenantId: tid,
        date: { gte: start, lte: end },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            currentClassId: true,
          },
        },
      },
    });
  },

  async markMany(entries: MarkAttendanceInput[]) {
    const results = [];
    for (const e of entries) {
      const day = new Date(e.date);
      day.setHours(12, 0, 0, 0); // normalize

      const record = await prisma.attendance.upsert({
        where: {
          tenantId_studentId_date_period: {
            tenantId: e.tenantId,
            studentId: e.studentId,
            date: day,
            period: e.period ?? "",
          },
        },
        update: {
          status: e.status,
          remarks: e.remarks,
          markedById: e.markedById,
        },
        create: {
          tenantId: e.tenantId,
          studentId: e.studentId,
          date: day,
          status: e.status,
          period: e.period ?? "",
          remarks: e.remarks,
          markedById: e.markedById,
        },
      });
      results.push(record);
    }
    return results;
  },

  async summaryForDate(date: Date, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const rows = await prisma.attendance.groupBy({
      by: ["status"],
      where: { tenantId: tid, date: { gte: start, lte: end } },
      _count: { status: true },
    });

    const summary: Record<string, number> = {};
    for (const r of rows) {
      summary[r.status] = r._count.status;
    }
    return summary;
  },
};
