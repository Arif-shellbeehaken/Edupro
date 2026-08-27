"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type ChronicDigestState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** SMS admins a weekly summary of chronic absentees (not parents) */
export async function sendChronicAdminDigestAction(
  _prev: ChronicDigestState,
  formData: FormData
): Promise<ChronicDigestState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const days = Math.min(30, Math.max(7, Number(formData.get("days") || 7)));
  const threshold = Number(formData.get("threshold") || 20);

  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const report = await attendanceRepository.chronicAbsentees({
      from,
      to,
      thresholdPct: threshold,
    });

    const top = report.rows.slice(0, 5);
    const names = top
      .map((r) => `${r.name} ${r.pct}%`)
      .join("; ");
    const body = `সাপ্তাহিক অনুপস্থিতি ডাইজেস্ট (${days} দিন): ফ্ল্যাগড ${report.rows.length} জন (থ্রেশহোল্ড ${threshold}%)${names ? " — টপ: " + names : ""}। রিপোর্ট: /tenant/admin/reports/absenteeism — Edupro`;

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
      take: 15,
    });
    for (const a of admins) {
      if (a.phone) phones.add(a.phone);
    }

    let sent = 0;
    for (const phone of phones) {
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Chronic absence digest",
          body: body.slice(0, 320),
          relatedType: "CHRONIC_DIGEST",
          relatedId: session.user.tenantId,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/reports/absenteeism");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `অ্যাডমিন ডাইজেস্ট SMS ${sent} · ফ্ল্যাগড ${report.rows.length}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ডাইজেস্ট ব্যর্থ" };
  }
}
