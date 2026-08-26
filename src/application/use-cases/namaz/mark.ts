"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { namazRepository } from "@/infrastructure/database/repositories/namaz-repository";

export type NamazState = { error?: string; success?: boolean; count?: number; message?: string };

export async function markNamazAction(
  _prev: NamazState,
  formData: FormData
): Promise<NamazState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const dateStr = formData.get("date") as string;
  if (!dateStr) return { error: "তারিখ দিন" };
  const date = new Date(dateStr);

  const studentIds = formData.getAll("studentId") as string[];
  if (studentIds.length === 0) return { error: "শিক্ষার্থী নেই" };

  const notifyAbsent = formData.get("notifyAbsent") === "on";
  const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
  const PRAYER_BN: Record<string, string> = {
    fajr: "ফজর",
    dhuhr: "যোহর",
    asr: "আসর",
    maghrib: "মাগরিব",
    isha: "এশা",
  };

  try {
    let count = 0;
    const absentMap: { studentId: string; prayers: string[] }[] = [];

    for (const studentId of studentIds) {
      const statuses: Record<string, string> = {};
      const missed: string[] = [];
      for (const k of PRAYER_KEYS) {
        const v = (formData.get(`${k}__${studentId}`) as string) || "ABSENT";
        statuses[k] = v;
        if (v === "ABSENT") missed.push(PRAYER_BN[k] || k);
      }
      await namazRepository.upsertDay({
        tenantId: session.user.tenantId,
        studentId,
        date,
        fajr: statuses.fajr,
        dhuhr: statuses.dhuhr,
        asr: statuses.asr,
        maghrib: statuses.maghrib,
        isha: statuses.isha,
        markedById: session.user.id,
      });
      count++;
      if (missed.length > 0) {
        absentMap.push({ studentId, prayers: missed });
      }
    }

    let smsSent = 0;
    if (notifyAbsent && absentMap.length > 0) {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const ids = absentMap.map((a) => a.studentId);
        const students = await prisma.student.findMany({
          where: { id: { in: ids }, tenantId: session.user.tenantId },
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            fatherPhone: true,
            guardianPhone: true,
          },
        });
        const byId = new Map(students.map((s) => [s.id, s]));
        const dateLabel = date.toLocaleDateString("en-GB");
        for (const row of absentMap) {
          const st = byId.get(row.studentId);
          if (!st) continue;
          const phone = st.guardianPhone || st.fatherPhone;
          if (!phone) continue;
          // Only SMS if 2+ prayers missed or user explicitly notified
          if (row.prayers.length < 1) continue;
          const body = `নামাজ অনুপস্থিতি: ${st.nameBn || st.name} (${st.studentId}) — ${dateLabel}: ${row.prayers.join(", ")} অনুপস্থিত। — Edupro`;
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Namaz absence",
              body,
              relatedType: "NAMAZ",
              relatedId: st.id,
            });
            smsSent += 1;
          } catch {
            /* continue */
          }
        }
      } catch (smsErr) {
        console.error("namaz SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/namaz");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      count,
      message: notifyAbsent
        ? `${count} জন সংরক্ষিত · অনুপস্থিত SMS ${smsSent}`
        : undefined,
    };
  } catch (e) {
    console.error(e);
    return { error: "নামাজ রেকর্ড সংরক্ষণ ব্যর্থ" };
  }
}
