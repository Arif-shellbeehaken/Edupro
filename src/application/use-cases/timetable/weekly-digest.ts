"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import {
  timetableRepository,
  DAY_NAMES_BN,
} from "@/infrastructure/database/repositories/timetable-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type DigestState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function sendTimetableDigestAction(
  _prev: DigestState,
  formData: FormData
): Promise<DigestState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const classId = String(formData.get("classId") || "") || undefined;

  try {
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    const slots = await timetableRepository.listSlots({
      tenantId: session.user.tenantId,
      classId,
    });
    if (slots.length === 0) {
      return { error: "কোনো রুটিন স্লট নেই" };
    }

    // Build short digest text (max ~300 chars for SMS)
    const byDay: Record<number, string[]> = {};
    for (const s of slots) {
      const subj = s.subject?.nameBn || s.subject?.name || "ক্লাস";
      const line = `P${s.periodNo} ${s.startTime}-${s.endTime} ${subj}`;
      if (!byDay[s.dayOfWeek]) byDay[s.dayOfWeek] = [];
      if (byDay[s.dayOfWeek].length < 3) byDay[s.dayOfWeek].push(line);
    }
    const parts: string[] = [];
    for (let d = 0; d <= 6; d++) {
      if (byDay[d]?.length) {
        parts.push(`${DAY_NAMES_BN[d].slice(0, 3)}: ${byDay[d].join("; ")}`);
      }
    }
    let digest = parts.join(" | ");
    if (digest.length > 280) digest = digest.slice(0, 277) + "…";

    const students = await prisma.student.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        ...(classId ? { currentClassId: classId } : {}),
      },
      select: { fatherPhone: true, guardianPhone: true },
      take: classId ? 400 : 200,
    });

    const phones = new Set<string>();
    for (const st of students) {
      const ph = st.guardianPhone || st.fatherPhone;
      if (ph) phones.add(ph);
    }

    let sent = 0;
    const body = `সাপ্তাহিক রুটিন: ${digest} — Edupro`;
    for (const phone of phones) {
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Weekly timetable",
          body,
          relatedType: "TIMETABLE_DIGEST",
          relatedId: classId,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/timetable");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `রুটিন ডাইজেস্ট SMS ${sent}/${phones.size}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "রুটিন ডাইজেস্ট ব্যর্থ" };
  }
}
