"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { timetableRepository } from "@/infrastructure/database/repositories/timetable-repository";

const schema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  periodNo: z.coerce.number().int().min(1).max(12),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  subjectId: z.string().optional(),
  room: z.string().optional(),
  classId: z.string().optional(),
});

export type UpsertSlotState = { error?: string; success?: boolean; message?: string };

export async function upsertTimetableSlotAction(
  _prev: UpsertSlotState,
  formData: FormData
): Promise<UpsertSlotState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = schema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    periodNo: formData.get("periodNo"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    subjectId: formData.get("subjectId") || undefined,
    room: formData.get("room") || undefined,
    classId: formData.get("classId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  const notifyClass = formData.get("notifyClass") === "on";
  const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

  try {
    await timetableRepository.upsertSlot({
      tenantId: session.user.tenantId,
      ...parsed.data,
    });

    let smsNote = "";
    if (notifyClass && parsed.data.classId) {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const [cls, subject, students] = await Promise.all([
          prisma.class.findFirst({
            where: { id: parsed.data.classId, tenantId: session.user.tenantId },
            select: { name: true, nameBn: true },
          }),
          parsed.data.subjectId
            ? prisma.subject.findFirst({
                where: { id: parsed.data.subjectId },
                select: { name: true, nameBn: true },
              })
            : Promise.resolve(null),
          prisma.student.findMany({
            where: {
              tenantId: session.user.tenantId,
              currentClassId: parsed.data.classId,
              deletedAt: null,
              status: "ACTIVE",
            },
            select: { fatherPhone: true, guardianPhone: true },
            take: 300,
          }),
        ]);
        const classLabel = cls?.nameBn || cls?.name || "ক্লাস";
        const subj = subject?.nameBn || subject?.name || "বিষয়";
        const day = DAYS[parsed.data.dayOfWeek] ?? String(parsed.data.dayOfWeek);
        const body = `রুটিন আপডেট: ${classLabel} — ${day} পিরিয়ড ${parsed.data.periodNo} (${parsed.data.startTime}-${parsed.data.endTime}) ${subj}${parsed.data.room ? ", রুম " + parsed.data.room : ""}। — Edupro`;
        const phones = new Set<string>();
        for (const s of students) {
          const ph = s.guardianPhone || s.fatherPhone;
          if (ph) phones.add(ph);
        }
        let sent = 0;
        for (const phone of phones) {
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Timetable update",
              body,
              relatedType: "TIMETABLE",
              relatedId: parsed.data.classId,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
        smsNote = ` · SMS ${sent}`;
      } catch (smsErr) {
        console.error("timetable SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/timetable");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `সংরক্ষিত${smsNote}` } as UpsertSlotState & { message?: string };
  } catch (e) {
    console.error(e);
    return { error: "রুটিন স্লট সংরক্ষণ ব্যর্থ" };
  }
}
