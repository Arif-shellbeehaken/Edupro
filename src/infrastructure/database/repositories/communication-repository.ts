import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

/**
 * Production note: SMS/WhatsApp providers (SSL Wireless, Twilio, Meta)
 * would be plugged in here. For now we persist QUEUED → SENT logs
 * so the UI and audit trail are production-ready.
 */
export const communicationRepository = {
  async listMessages(tenantId?: string, take = 40) {
    const tid = tenantId ?? requireTenantId();
    return prisma.messageLog.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async sendMessage(data: {
    tenantId: string;
    channel: string;
    recipient: string;
    subject?: string;
    body: string;
    relatedType?: string;
    relatedId?: string;
  }) {
    // Simulate provider send — mark SENT immediately in dev
    return prisma.messageLog.create({
      data: {
        tenantId: data.tenantId,
        channel: data.channel,
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  },

  async bulkSmsToStudents(data: {
    tenantId: string;
    body: string;
    subject?: string;
  }) {
    const students = await prisma.student.findMany({
      where: {
        tenantId: data.tenantId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        fatherPhone: true,
        guardianPhone: true,
        name: true,
      },
      take: 200,
    });

    const logs = [];
    for (const s of students) {
      const phone = s.guardianPhone || s.fatherPhone;
      if (!phone) continue;
      const log = await prisma.messageLog.create({
        data: {
          tenantId: data.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: data.subject,
          body: data.body,
          relatedType: "STUDENT",
          relatedId: s.id,
          status: "SENT",
          sentAt: new Date(),
        },
      });
      logs.push(log);
    }
    return logs;
  },

  async listNotices(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.notice.findMany({
      where: { tenantId: tid },
      orderBy: { publishedAt: "desc" },
      take: 30,
    });
  },

  async createNotice(data: {
    tenantId: string;
    title: string;
    titleBn?: string;
    body: string;
    audience?: string;
  }) {
    return prisma.notice.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        titleBn: data.titleBn,
        body: data.body,
        audience: data.audience ?? "ALL",
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  },
};
