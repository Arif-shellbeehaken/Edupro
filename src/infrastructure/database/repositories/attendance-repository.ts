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

  /**
   * Students whose absence rate over [from, to] is at or above thresholdPct.
   * Counts distinct days with ABSENT (period empty preferred; all periods counted as day if any ABSENT).
   */
  async chronicAbsentees(options: {
    tenantId?: string;
    from: Date;
    to: Date;
    thresholdPct?: number; // default 20
    classId?: string;
  }) {
    const tid = options.tenantId ?? requireTenantId();
    const threshold = options.thresholdPct ?? 20;
    const from = new Date(options.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(options.to);
    to.setHours(23, 59, 59, 999);

    const msDay = 24 * 60 * 60 * 1000;
    const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / msDay) + 1);

    const students = await prisma.student.findMany({
      where: {
        tenantId: tid,
        deletedAt: null,
        status: "ACTIVE",
        ...(options.classId ? { currentClassId: options.classId } : {}),
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
        currentClass: { select: { name: true, nameBn: true } },
      },
      take: 500,
    });

    const rows = await prisma.attendance.findMany({
      where: {
        tenantId: tid,
        date: { gte: from, lte: to },
        studentId: { in: students.map((s) => s.id) },
      },
      select: { studentId: true, date: true, status: true },
    });

    // day key per student
    const absentDays = new Map<string, Set<string>>();
    const markedDays = new Map<string, Set<string>>();
    for (const r of rows) {
      const day = r.date.toISOString().slice(0, 10);
      if (!markedDays.has(r.studentId)) markedDays.set(r.studentId, new Set());
      markedDays.get(r.studentId)!.add(day);
      if (r.status === "ABSENT") {
        if (!absentDays.has(r.studentId)) absentDays.set(r.studentId, new Set());
        absentDays.get(r.studentId)!.add(day);
      }
    }

    const result = students
      .map((s) => {
        const abs = absentDays.get(s.id)?.size ?? 0;
        const marked = markedDays.get(s.id)?.size ?? 0;
        const base = marked > 0 ? marked : spanDays;
        const pct = Math.round((abs / base) * 1000) / 10;
        return {
          id: s.id,
          name: s.nameBn || s.name,
          studentId: s.studentId,
          className: s.currentClass?.nameBn || s.currentClass?.name || "—",
          phone: s.guardianPhone || s.fatherPhone || "",
          absentDays: abs,
          markedDays: marked,
          spanDays,
          pct,
        };
      })
      .filter((r) => r.pct >= threshold)
      .sort((a, b) => b.pct - a.pct || b.absentDays - a.absentDays);

    return { spanDays, threshold, rows: result };
  },
};
