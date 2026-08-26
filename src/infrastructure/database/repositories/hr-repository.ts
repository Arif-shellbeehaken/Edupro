import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

export const hrRepository = {
  // ─── Staff ───────────────────────────────────────────────────
  async listStaff(options?: {
    tenantId?: string;
    status?: string;
    search?: string;
    take?: number;
  }) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.staff.findMany({
      where: {
        tenantId: tid,
        deletedAt: null,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.search
          ? {
              OR: [
                { name: { contains: options.search } },
                { nameBn: { contains: options.search } },
                { employeeId: { contains: options.search } },
                { designation: { contains: options.search } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: options?.take ?? 100,
    });
  },

  async findStaff(id: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.staff.findFirst({
      where: { id, tenantId: tid, deletedAt: null },
    });
  },

  async createStaff(data: {
    tenantId: string;
    employeeId: string;
    name: string;
    nameBn?: string;
    email?: string;
    phone?: string;
    gender?: string;
    designation: string;
    department?: string;
    roleType?: string;
    joiningDate?: Date;
    employmentType?: string;
    basicSalary?: number;
    houseRent?: number;
    medicalAllow?: number;
    otherAllow?: number;
    bankName?: string;
    bankAccount?: string;
    address?: string;
    emergencyContact?: string;
  }) {
    return prisma.staff.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        name: data.name,
        nameBn: data.nameBn,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        designation: data.designation,
        department: data.department,
        roleType: data.roleType ?? "TEACHER",
        joiningDate: data.joiningDate,
        employmentType: data.employmentType ?? "FULL_TIME",
        basicSalary: data.basicSalary ?? 0,
        houseRent: data.houseRent ?? 0,
        medicalAllow: data.medicalAllow ?? 0,
        otherAllow: data.otherAllow ?? 0,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        address: data.address,
        emergencyContact: data.emergencyContact,
        status: "ACTIVE",
      },
    });
  },

  async updateStaff(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      nameBn: string;
      phone: string;
      designation: string;
      department: string;
      status: string;
      basicSalary: number;
      houseRent: number;
      medicalAllow: number;
      otherAllow: number;
      bankName: string;
      bankAccount: string;
    }>
  ) {
    return prisma.staff.updateMany({
      where: { id, tenantId },
      data,
    });
  },

  async staffCount(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.staff.count({
      where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
    });
  },

  // ─── Leave ───────────────────────────────────────────────────
  async listLeaves(options?: {
    tenantId?: string;
    status?: string;
    staffId?: string;
    take?: number;
  }) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.leaveRequest.findMany({
      where: {
        tenantId: tid,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.staffId ? { staffId: options.staffId } : {}),
      },
      include: {
        staff: {
          select: { id: true, name: true, nameBn: true, employeeId: true, designation: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.take ?? 50,
    });
  },

  async createLeave(data: {
    tenantId: string;
    staffId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }) {
    const days = daysBetween(data.startDate, data.endDate);
    return prisma.leaveRequest.create({
      data: {
        tenantId: data.tenantId,
        staffId: data.staffId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        days,
        reason: data.reason,
        status: "PENDING",
      },
    });
  },

  async reviewLeave(data: {
    id: string;
    tenantId: string;
    status: "APPROVED" | "REJECTED";
    reviewedById: string;
    reviewNote?: string;
  }) {
    return prisma.leaveRequest.updateMany({
      where: { id: data.id, tenantId: data.tenantId, status: "PENDING" },
      data: {
        status: data.status,
        reviewedById: data.reviewedById,
        reviewedAt: new Date(),
        reviewNote: data.reviewNote,
      },
    });
  },

  // ─── Payroll ─────────────────────────────────────────────────
  async listPayrollRuns(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.payrollRun.findMany({
      where: { tenantId: tid },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        _count: { select: { payments: true } },
        payments: {
          select: { netSalary: true, status: true },
        },
      },
      take: 24,
    });
  },

  async getPayrollRun(id: string, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.payrollRun.findFirst({
      where: { id, tenantId: tid },
      include: {
        payments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                nameBn: true,
                employeeId: true,
                designation: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Create payroll run for a month and generate salary lines for all ACTIVE staff.
   * Deduction: simple unpaid leave days in that month * (basic/30).
   */
  async processPayroll(data: {
    tenantId: string;
    month: number;
    year: number;
    notes?: string;
  }) {
    const existing = await prisma.payrollRun.findUnique({
      where: {
        tenantId_month_year: {
          tenantId: data.tenantId,
          month: data.month,
          year: data.year,
        },
      },
    });
    if (existing && existing.status !== "DRAFT") {
      throw new Error("এই মাসের পে-রোল ইতিমধ্যে প্রসেস/পেইড");
    }

    const staffList = await prisma.staff.findMany({
      where: {
        tenantId: data.tenantId,
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (staffList.length === 0) {
      throw new Error("কোনো সক্রিয় স্টাফ নেই");
    }

    // Month date range for unpaid leave deduction
    const monthStart = new Date(data.year, data.month - 1, 1);
    const monthEnd = new Date(data.year, data.month, 0, 23, 59, 59);

    const unpaidLeaves = await prisma.leaveRequest.findMany({
      where: {
        tenantId: data.tenantId,
        status: "APPROVED",
        leaveType: "UNPAID",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
    });

    const unpaidDaysByStaff: Record<string, number> = {};
    for (const lv of unpaidLeaves) {
      unpaidDaysByStaff[lv.staffId] =
        (unpaidDaysByStaff[lv.staffId] ?? 0) + lv.days;
    }

    return prisma.$transaction(async (tx) => {
      let run = existing;
      if (!run) {
        run = await tx.payrollRun.create({
          data: {
            tenantId: data.tenantId,
            month: data.month,
            year: data.year,
            status: "PROCESSED",
            processedAt: new Date(),
            notes: data.notes,
          },
        });
      } else {
        // Clear old draft payments and re-process
        await tx.salaryPayment.deleteMany({ where: { payrollRunId: run.id } });
        run = await tx.payrollRun.update({
          where: { id: run.id },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
            notes: data.notes,
          },
        });
      }

      const payments = [];
      for (const staff of staffList) {
        const gross =
          staff.basicSalary +
          staff.houseRent +
          staff.medicalAllow +
          staff.otherAllow;
        const unpaidDays = unpaidDaysByStaff[staff.id] ?? 0;
        const perDay = staff.basicSalary > 0 ? staff.basicSalary / 30 : 0;
        const deduction = Math.round(unpaidDays * perDay);
        const net = Math.max(0, gross - deduction);

        const payment = await tx.salaryPayment.create({
          data: {
            tenantId: data.tenantId,
            payrollRunId: run.id,
            staffId: staff.id,
            basicSalary: staff.basicSalary,
            houseRent: staff.houseRent,
            medicalAllow: staff.medicalAllow,
            otherAllow: staff.otherAllow,
            grossSalary: gross,
            deduction,
            netSalary: net,
            status: "PENDING",
          },
        });
        payments.push(payment);
      }

      return { run, payments };
    });
  },

  async markSalaryPaid(data: {
    paymentId: string;
    tenantId: string;
    paymentMethod?: string;
    transactionId?: string;
  }) {
    return prisma.salaryPayment.updateMany({
      where: { id: data.paymentId, tenantId: data.tenantId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: data.paymentMethod ?? "BANK",
        transactionId: data.transactionId,
      },
    });
  },

  async markAllSalariesPaid(payrollRunId: string, tenantId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.salaryPayment.updateMany({
        where: { payrollRunId, tenantId, status: "PENDING" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: "BANK",
        },
      });
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: "PAID" },
      });
    });
  },

  // ─── Staff Attendance ───────────────────────────────────────
  async listStaffAttendance(options: {
    tenantId?: string;
    date: Date;
    take?: number;
  }) {
    const tid = options.tenantId ?? requireTenantId();
    const start = new Date(options.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return prisma.staffAttendance.findMany({
      where: {
        tenantId: tid,
        date: { gte: start, lt: end },
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            nameBn: true,
            employeeId: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: { staff: { name: "asc" } },
      take: options.take ?? 200,
    });
  },

  async upsertStaffAttendance(data: {
    tenantId: string;
    staffId: string;
    date: Date;
    status: string;
    checkIn?: string;
    checkOut?: string;
    remarks?: string;
    markedById?: string;
  }) {
    const day = new Date(data.date);
    day.setHours(0, 0, 0, 0);
    return prisma.staffAttendance.upsert({
      where: {
        tenantId_staffId_date: {
          tenantId: data.tenantId,
          staffId: data.staffId,
          date: day,
        },
      },
      create: {
        tenantId: data.tenantId,
        staffId: data.staffId,
        date: day,
        status: data.status,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        remarks: data.remarks,
        markedById: data.markedById,
      },
      update: {
        status: data.status,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        remarks: data.remarks,
        markedById: data.markedById,
      },
    });
  },

  async bulkMarkStaffAttendance(data: {
    tenantId: string;
    date: Date;
    marks: { staffId: string; status: string }[];
    markedById?: string;
  }) {
    const day = new Date(data.date);
    day.setHours(0, 0, 0, 0);
    await prisma.$transaction(
      data.marks.map((m) =>
        prisma.staffAttendance.upsert({
          where: {
            tenantId_staffId_date: {
              tenantId: data.tenantId,
              staffId: m.staffId,
              date: day,
            },
          },
          create: {
            tenantId: data.tenantId,
            staffId: m.staffId,
            date: day,
            status: m.status,
            markedById: data.markedById,
          },
          update: {
            status: m.status,
            markedById: data.markedById,
          },
        })
      )
    );
  },

  async listApprovedLeavesForMonth(options: {
    tenantId?: string;
    year: number;
    month: number;
  }) {
    const tid = options.tenantId ?? requireTenantId();
    const start = new Date(options.year, options.month - 1, 1);
    const end = new Date(options.year, options.month, 0, 23, 59, 59);
    return prisma.leaveRequest.findMany({
      where: {
        tenantId: tid,
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: {
        staff: {
          select: { id: true, name: true, nameBn: true, employeeId: true },
        },
      },
      orderBy: { startDate: "asc" },
    });
  },
};
