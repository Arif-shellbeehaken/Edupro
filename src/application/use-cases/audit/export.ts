"use server";

import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type AuditExportState = {
  error?: string;
  success?: boolean;
  message?: string;
  csv?: string;
};

export async function exportAuditLogAction(
  _prev: AuditExportState,
  formData: FormData
): Promise<AuditExportState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const days = Math.min(90, Math.max(1, Number(formData.get("days") || 30)));
  const notify = formData.get("notify") === "on";

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const header = "id,action,entityType,entityId,userId,createdAt";
    const rows = logs.map((l) =>
      [
        l.id,
        l.action,
        l.entityType || "",
        l.entityId || "",
        l.userId || "",
        l.createdAt.toISOString(),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "AUDIT_EXPORT",
        entityType: "AuditLog",
        newValues: { days, count: logs.length },
      },
    });

    let smsNote = "";
    if (notify) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const phones = new Set<string>();
        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          select: { phone: true },
        });
        if (tenant?.phone) phones.add(tenant.phone);
        const admins = await prisma.user.findMany({
          where: {
            tenantId: session.user.tenantId,
            role: { in: ["ADMIN", "ACCOUNTANT"] },
          },
          select: { phone: true },
          take: 10,
        });
        for (const a of admins) {
          if (a.phone) phones.add(a.phone);
        }
        const body = `অডিট এক্সপোর্ট: শেষ ${days} দিনের ${logs.length}টি লগ CSV তৈরি হয়েছে (${session.user.name || "Admin"})। — Edupro`;
        let sent = 0;
        for (const phone of phones) {
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Audit export",
              body,
              relatedType: "AUDIT_EXPORT",
              relatedId: session.user.tenantId,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
        smsNote = ` · SMS ${sent}`;
      } catch (e) {
        console.error("audit export SMS", e);
      }
    }

    return {
      success: true,
      message: `${logs.length} লগ এক্সপোর্ট${smsNote}`,
      csv,
    };
  } catch (e) {
    console.error(e);
    return { error: "অডিট এক্সপোর্ট ব্যর্থ" };
  }
}
