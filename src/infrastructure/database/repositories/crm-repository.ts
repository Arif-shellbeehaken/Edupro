import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const crmRepository = {
  async listLeads(options?: {
    tenantId?: string;
    status?: string;
    take?: number;
  }) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.admissionLead.findMany({
      where: {
        tenantId: tid,
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.take ?? 50,
    });
  },

  async createLead(data: {
    tenantId: string;
    applicantName: string;
    applicantNameBn?: string;
    fatherName?: string;
    phone: string;
    email?: string;
    gender?: string;
    applyingClass?: string;
    source?: string;
    notes?: string;
    followUpAt?: Date;
  }) {
    return prisma.admissionLead.create({
      data: {
        tenantId: data.tenantId,
        applicantName: data.applicantName,
        applicantNameBn: data.applicantNameBn,
        fatherName: data.fatherName,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        applyingClass: data.applyingClass,
        source: data.source ?? "WALK_IN",
        notes: data.notes,
        followUpAt: data.followUpAt,
        status: "NEW",
      },
    });
  },

  async updateLeadStatus(data: {
    id: string;
    tenantId: string;
    status: string;
    notes?: string;
  }) {
    return prisma.admissionLead.updateMany({
      where: { id: data.id, tenantId: data.tenantId },
      data: {
        status: data.status,
        ...(data.notes ? { notes: data.notes } : {}),
      },
    });
  },

  async pipelineSummary(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const rows = await prisma.admissionLead.groupBy({
      by: ["status"],
      where: { tenantId: tid },
      _count: { status: true },
    });
    const summary: Record<string, number> = {};
    for (const r of rows) summary[r.status] = r._count.status;
    return summary;
  },
};
