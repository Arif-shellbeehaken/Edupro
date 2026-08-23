import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const extendedRepository = {
  // ─── Donations ─────────────────────────────────────────────
  async listDonations(tenantId?: string, take = 50) {
    const tid = tenantId ?? requireTenantId();
    return prisma.donation.findMany({
      where: { tenantId: tid },
      orderBy: { receivedAt: "desc" },
      take,
    });
  },

  async createDonation(data: {
    tenantId: string;
    donorName: string;
    donorPhone?: string;
    amount: number;
    category: string;
    method?: string;
    notes?: string;
    receivedById?: string;
  }) {
    const count = await prisma.donation.count({ where: { tenantId: data.tenantId } });
    const receiptNo = `DON-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    return prisma.donation.create({
      data: {
        tenantId: data.tenantId,
        donorName: data.donorName,
        donorPhone: data.donorPhone,
        amount: data.amount,
        category: data.category,
        method: data.method,
        notes: data.notes,
        receiptNo,
        receivedById: data.receivedById,
      },
    });
  },

  async donationSummary(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const rows = await prisma.donation.groupBy({
      by: ["category"],
      where: { tenantId: tid },
      _sum: { amount: true },
      _count: true,
    });
    return rows.map((r) => ({
      category: r.category,
      total: r._sum.amount ?? 0,
      count: r._count,
    }));
  },

  // ─── Visitors ──────────────────────────────────────────────
  async listVisitors(tenantId?: string, take = 40) {
    const tid = tenantId ?? requireTenantId();
    return prisma.visitorLog.findMany({
      where: { tenantId: tid },
      orderBy: { checkInAt: "desc" },
      take,
    });
  },

  async checkInVisitor(data: {
    tenantId: string;
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    hostName?: string;
    studentId?: string;
    vehicleNo?: string;
    notes?: string;
  }) {
    return prisma.visitorLog.create({
      data: { ...data, status: "IN" },
    });
  },

  async checkOutVisitor(id: string, tenantId: string) {
    return prisma.visitorLog.updateMany({
      where: { id, tenantId, status: "IN" },
      data: { status: "OUT", checkOutAt: new Date() },
    });
  },

  // ─── Grievances ────────────────────────────────────────────
  async listGrievances(tenantId?: string, take = 40) {
    const tid = tenantId ?? requireTenantId();
    return prisma.grievance.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async createGrievance(data: {
    tenantId: string;
    submittedBy?: string;
    contactPhone?: string;
    category: string;
    subject: string;
    description: string;
    priority?: string;
  }) {
    return prisma.grievance.create({
      data: {
        tenantId: data.tenantId,
        submittedBy: data.submittedBy,
        contactPhone: data.contactPhone,
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority ?? "MEDIUM",
        status: "OPEN",
      },
    });
  },

  async updateGrievanceStatus(data: {
    id: string;
    tenantId: string;
    status: string;
    resolution?: string;
  }) {
    return prisma.grievance.updateMany({
      where: { id: data.id, tenantId: data.tenantId },
      data: {
        status: data.status,
        resolution: data.resolution,
        ...(data.status === "RESOLVED" || data.status === "CLOSED"
          ? { resolvedAt: new Date() }
          : {}),
      },
    });
  },

  // ─── Homework ──────────────────────────────────────────────
  async listHomework(tenantId?: string, take = 40) {
    const tid = tenantId ?? requireTenantId();
    return prisma.homework.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async createHomework(data: {
    tenantId: string;
    title: string;
    description?: string;
    subjectName?: string;
    dueDate?: Date;
    assignedById?: string;
  }) {
    return prisma.homework.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        subjectName: data.subjectName,
        dueDate: data.dueDate,
        assignedById: data.assignedById,
        status: "ACTIVE",
      },
    });
  },

  // ─── Audit ─────────────────────────────────────────────────
  async listAudit(tenantId?: string, take = 50) {
    return prisma.auditLog.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async writeAudit(data: {
    tenantId?: string;
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    newValues?: object;
  }) {
    return prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        newValues: data.newValues ?? undefined,
      },
    });
  },
};
