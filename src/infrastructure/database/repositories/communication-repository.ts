import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";
import { sendSms } from "@/infrastructure/sms/provider";

/**
 * SMS/WhatsApp provider plug-in via infrastructure/sms/provider.ts
 * Env: SMS_PROVIDER=console|sslwireless|http, SMS_API_KEY, SMS_SENDER_ID, SMS_API_ENDPOINT
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
    let status = "SENT";
    let errorMessage: string | undefined;
    let providerId: string | undefined;

    if (data.channel === "SMS" || data.channel === "WHATSAPP") {
      const result = await sendSms(data.recipient, data.body);
      if (!result.success) {
        status = "FAILED";
        errorMessage = result.error;
      } else {
        providerId = result.providerMessageId;
      }
    }

    return prisma.messageLog.create({
      data: {
        tenantId: data.tenantId,
        channel: data.channel,
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        status,
        errorMessage,
        sentAt: status === "SENT" ? new Date() : undefined,
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
      const result = await sendSms(phone, data.body);
      const log = await prisma.messageLog.create({
        data: {
          tenantId: data.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: data.subject,
          body: data.body,
          relatedType: "STUDENT",
          relatedId: s.id,
          status: result.success ? "SENT" : "FAILED",
          errorMessage: result.error,
          sentAt: result.success ? new Date() : undefined,
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
