"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type CampusDigestState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** Aggregate counts and SMS campus + tenant phones */
export async function sendCampusReportDigestAction(
  _prev: CampusDigestState,
  _formData: FormData
): Promise<CampusDigestState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const tenantId = session.user.tenantId;

  try {
    const [students, staff, overdueInv, campuses] = await Promise.all([
      prisma.student.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.staff.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        },
      }),
      prisma.campus.findMany({
        where: { tenantId },
        select: { id: true, name: true, nameBn: true, phone: true, code: true },
      }),
    ]);

    const digest = `ক্যাম্পাস রিপোর্ট: শিক্ষার্থী ${students}, স্টাফ ${staff}, বকেয়া চালান ${overdueInv}, শাখা ${campuses.length}। — Edupro`;

    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    const phones = new Set<string>();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { phone: true },
    });
    if (tenant?.phone) phones.add(tenant.phone);
    for (const c of campuses) {
      if (c.phone) phones.add(c.phone);
    }
    const admins = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ["ADMIN", "ACCOUNTANT"] },
      },
      select: { phone: true },
      take: 10,
    });
    for (const a of admins) {
      if (a.phone) phones.add(a.phone);
    }

    let sent = 0;
    for (const phone of phones) {
      try {
        await communicationRepository.sendMessage({
          tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Campus report digest",
          body: digest,
          relatedType: "CAMPUS_DIGEST",
          relatedId: tenantId,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/campuses");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `ডাইজেস্ট SMS ${sent}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ক্যাম্পাস ডাইজেস্ট ব্যর্থ" };
  }
}
