"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type MarkAttendanceState = {
  error?: string;
  success?: boolean;
  count?: number;
  smsSent?: number;
  message?: string;
};

export async function markAttendanceAction(
  _prev: MarkAttendanceState,
  formData: FormData
): Promise<MarkAttendanceState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) {
    return { error: "অনুমতি নেই" };
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const dateStr = formData.get("date") as string;
  if (!dateStr) return { error: "তারিখ দিন" };

  const notifyAbsent = formData.get("notifyAbsent") === "on";
  const date = new Date(dateStr);
  const entries: {
    tenantId: string;
    studentId: string;
    date: Date;
    status: string;
    markedById: string;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("status__") && typeof value === "string" && value) {
      const studentId = key.replace("status__", "");
      entries.push({
        tenantId: session.user.tenantId,
        studentId,
        date,
        status: value,
        markedById: session.user.id,
      });
    }
  }

  if (entries.length === 0) {
    return { error: "কোনো উপস্থিতি সিলেক্ট করা হয়নি" };
  }

  try {
    await attendanceRepository.markMany(entries);

    let smsSent = 0;
    if (notifyAbsent) {
      const absentIds = entries
        .filter((e) => e.status === "ABSENT")
        .map((e) => e.studentId);

      if (absentIds.length > 0) {
        const students = await prisma.student.findMany({
          where: {
            tenantId: session.user.tenantId,
            id: { in: absentIds },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            nameBn: true,
            studentId: true,
            fatherPhone: true,
            guardianPhone: true,
          },
        });

        const dateLabel = date.toLocaleDateString("en-GB");
        for (const s of students) {
          const phone = s.guardianPhone || s.fatherPhone;
          if (!phone) continue;
          const body = `অনুপস্থিতি নোটিশ: ${s.nameBn || s.name} (${s.studentId}) আজ ${dateLabel} অনুপস্থিত। — Edupro`;
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Absence notice",
              body,
              relatedType: "ATTENDANCE",
              relatedId: s.id,
            });
            smsSent += 1;
          } catch {
            /* continue */
          }
        }
      }
    }

    revalidatePath("/tenant/admin/attendance");
    revalidatePath("/tenant/admin/communication");

    return {
      success: true,
      count: entries.length,
      smsSent,
      message: notifyAbsent
        ? `${entries.length} জন সংরক্ষিত · অনুপস্থিত SMS ${smsSent} টি`
        : undefined,
    };
  } catch (e) {
    console.error(e);
    return { error: "উপস্থিতি সংরক্ষণ করা যায়নি" };
  }
}
