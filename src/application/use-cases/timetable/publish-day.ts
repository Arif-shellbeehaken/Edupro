"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import {
  timetableRepository,
  DAY_NAMES_BN,
} from "@/infrastructure/database/repositories/timetable-repository";

export type PublishDayState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** Publish all slots for a dayOfWeek to class guardians (timetable change notice) */
export async function publishDayTimetableAction(
  _prev: PublishDayState,
  formData: FormData
): Promise<PublishDayState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 0);
  const classId = String(formData.get("classId") || "") || undefined;
  if (dayOfWeek < 0 || dayOfWeek > 6) return { error: "দিন বাছুন" };

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    const slots = await timetableRepository.listSlots({
      dayOfWeek,
      classId,
    });

    if (slots.length === 0) {
      return { error: "এই দিনে কোনো স্লট নেই" };
    }

    // Group by classId
    const byClass = new Map<string, typeof slots>();
    for (const s of slots) {
      const key = s.classId || "_all";
      if (!byClass.has(key)) byClass.set(key, []);
      byClass.get(key)!.push(s);
    }

    const dayName = DAY_NAMES_BN[dayOfWeek] || String(dayOfWeek);
    let sent = 0;
    let targets = 0;

    for (const [cid, classSlots] of byClass) {
      const summary = classSlots
        .slice(0, 6)
        .map(
          (s) =>
            `P${s.periodNo} ${s.startTime}-${s.endTime}${s.subject?.name ? " " + s.subject.name : ""}${s.room ? " @" + s.room : ""}`
        )
        .join("; ");

      const students = await prisma.student.findMany({
        where: {
          tenantId: session.user.tenantId,
          deletedAt: null,
          status: "ACTIVE",
          ...(cid !== "_all" ? { currentClassId: cid } : {}),
        },
        select: { guardianPhone: true, fatherPhone: true },
        take: 400,
      });

      const phones = new Set<string>();
      for (const st of students) {
        const ph = st.guardianPhone || st.fatherPhone;
        if (ph) phones.add(ph);
      }
      targets += phones.size;

      const body = `রুটিন আপডেট (${dayName}): ${summary}${classSlots.length > 6 ? "…" : ""}। — Edupro`;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: `Timetable ${dayName}`,
            body: body.slice(0, 320),
            relatedType: "TIMETABLE_DAY",
            relatedId: session.user.tenantId,
          });
          sent += 1;
        } catch {
          /* continue */
        }
      }
    }

    revalidatePath("/tenant/admin/timetable");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `${dayName} রুটিন SMS ${sent}/${targets}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "রুটিন প্রকাশ ব্যর্থ" };
  }
}
