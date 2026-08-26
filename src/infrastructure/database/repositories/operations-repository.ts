import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

const FINE_PER_DAY = 10; // BDT

export const operationsRepository = {
  // ═══ LIBRARY ═══════════════════════════════════════════════
  async listBooks(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.book.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { title: "asc" },
      include: { _count: { select: { issues: true } } },
    });
  },

  async createBook(data: {
    tenantId: string;
    title: string;
    titleBn?: string;
    author?: string;
    isbn?: string;
    category?: string;
    totalCopies?: number;
    shelfLocation?: string;
  }) {
    const copies = data.totalCopies ?? 1;
    return prisma.book.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        titleBn: data.titleBn,
        author: data.author,
        isbn: data.isbn,
        category: data.category,
        totalCopies: copies,
        availableCopies: copies,
        shelfLocation: data.shelfLocation,
      },
    });
  },

  async issueBook(data: {
    tenantId: string;
    bookId: string;
    studentId?: string;
    days?: number;
  }) {
    const book = await prisma.book.findFirst({
      where: { id: data.bookId, tenantId: data.tenantId },
    });
    if (!book || book.availableCopies < 1) {
      throw new Error("বই পাওয়া যায়নি বা কপি নেই");
    }

    const due = new Date();
    due.setDate(due.getDate() + (data.days ?? 14));

    return prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.create({
        data: {
          tenantId: data.tenantId,
          bookId: data.bookId,
          studentId: data.studentId,
          dueDate: due,
          status: "ISSUED",
        },
      });
      await tx.book.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      });
      return issue;
    });
  },

  async returnBook(data: { issueId: string; tenantId: string }) {
    const issue = await prisma.bookIssue.findFirst({
      where: { id: data.issueId, tenantId: data.tenantId, status: "ISSUED" },
    });
    if (!issue) throw new Error("ইস্যু রেকর্ড পাওয়া যায়নি");

    const now = new Date();
    let fine = 0;
    if (now > issue.dueDate) {
      const daysLate = Math.ceil(
        (now.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      fine = daysLate * FINE_PER_DAY;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.bookIssue.update({
        where: { id: issue.id },
        data: {
          status: "RETURNED",
          returnedAt: now,
          fineAmount: fine,
        },
      });
      await tx.book.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });
      return updated;
    });
  },

  async listActiveIssues(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.bookIssue.findMany({
      where: { tenantId: tid, status: "ISSUED" },
      include: { book: { select: { title: true, titleBn: true } } },
      orderBy: { dueDate: "asc" },
      take: 50,
    });
  },

  async listOverdueIssues(tenantId?: string, take = 100) {
    const tid = tenantId ?? requireTenantId();
    const now = new Date();
    const issues = await prisma.bookIssue.findMany({
      where: {
        tenantId: tid,
        status: "ISSUED",
        dueDate: { lt: now },
      },
      include: {
        book: { select: { title: true, titleBn: true } },
      },
      orderBy: { dueDate: "asc" },
      take,
    });

    // Enrich with student contact when studentId present
    const studentIds = [
      ...new Set(issues.map((i) => i.studentId).filter(Boolean) as string[]),
    ];
    const students = studentIds.length
      ? await prisma.student.findMany({
          where: { id: { in: studentIds }, tenantId: tid },
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            fatherPhone: true,
            guardianPhone: true,
          },
        })
      : [];
    const byId = new Map(students.map((s) => [s.id, s]));

    return issues.map((i) => {
      const st = i.studentId ? byId.get(i.studentId) : undefined;
      const daysLate = Math.ceil(
        (now.getTime() - i.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...i,
        daysLate,
        student: st
          ? {
              id: st.id,
              name: st.nameBn || st.name,
              code: st.studentId,
              phone: st.guardianPhone || st.fatherPhone || "",
            }
          : null,
      };
    });
  },

  // ═══ HOSTEL ════════════════════════════════════════════════
  async listRooms(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.hostelRoom.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { roomNumber: "asc" },
      include: { _count: { select: { allocations: true } } },
    });
  },

  async createRoom(data: {
    tenantId: string;
    roomNumber: string;
    blockName?: string;
    capacity?: number;
    roomType?: string;
    monthlyFee?: number;
  }) {
    return prisma.hostelRoom.create({
      data: {
        tenantId: data.tenantId,
        roomNumber: data.roomNumber,
        blockName: data.blockName,
        capacity: data.capacity ?? 4,
        roomType: data.roomType ?? "SHARED",
        monthlyFee: data.monthlyFee ?? 0,
      },
    });
  },

  async allocateRoom(data: {
    tenantId: string;
    roomId: string;
    studentId: string;
    notes?: string;
  }) {
    const room = await prisma.hostelRoom.findFirst({
      where: { id: data.roomId, tenantId: data.tenantId },
    });
    if (!room) throw new Error("রুম পাওয়া যায়নি");
    if (room.occupied >= room.capacity) throw new Error("রুম পূর্ণ");

    return prisma.$transaction(async (tx) => {
      const alloc = await tx.hostelAllocation.create({
        data: {
          tenantId: data.tenantId,
          roomId: data.roomId,
          studentId: data.studentId,
          status: "ACTIVE",
          notes: data.notes,
        },
      });
      await tx.hostelRoom.update({
        where: { id: data.roomId },
        data: { occupied: { increment: 1 } },
      });
      return alloc;
    });
  },

  async endAllocation(data: { allocationId: string; tenantId: string }) {
    const alloc = await prisma.hostelAllocation.findFirst({
      where: {
        id: data.allocationId,
        tenantId: data.tenantId,
        status: "ACTIVE",
      },
    });
    if (!alloc) throw new Error("অ্যালোকেশন পাওয়া যায়নি");

    return prisma.$transaction(async (tx) => {
      await tx.hostelAllocation.update({
        where: { id: alloc.id },
        data: { status: "ENDED", endDate: new Date() },
      });
      await tx.hostelRoom.update({
        where: { id: alloc.roomId },
        data: { occupied: { decrement: 1 } },
      });
    });
  },

  async listAllocations(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.hostelAllocation.findMany({
      where: { tenantId: tid, status: "ACTIVE" },
      include: {
        room: { select: { roomNumber: true, blockName: true } },
      },
      orderBy: { startDate: "desc" },
      take: 50,
    });
  },

  // ═══ TRANSPORT ═════════════════════════════════════════════
  async listRoutes(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.transportRoute.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { assignments: true } } },
    });
  },

  async createRoute(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    vehicleNo?: string;
    driverName?: string;
    driverPhone?: string;
    monthlyFee?: number;
    capacity?: number;
  }) {
    return prisma.transportRoute.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        vehicleNo: data.vehicleNo,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        monthlyFee: data.monthlyFee ?? 0,
        capacity: data.capacity ?? 30,
      },
    });
  },

  async assignStudent(data: {
    tenantId: string;
    routeId: string;
    studentId: string;
    pickupPoint?: string;
  }) {
    return prisma.transportAssignment.create({
      data: {
        tenantId: data.tenantId,
        routeId: data.routeId,
        studentId: data.studentId,
        pickupPoint: data.pickupPoint,
        status: "ACTIVE",
      },
    });
  },

  async listAssignments(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.transportAssignment.findMany({
      where: { tenantId: tid, status: "ACTIVE" },
      include: {
        route: { select: { name: true, nameBn: true, vehicleNo: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
};