"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type SubState = { error?: string; success?: boolean; message?: string };

/**
 * Assign substitute teacher to a timetable slot (by slot id or class+day+period).
 */
export async function assignSubstituteAction(
  _prev: SubState,
  formData: FormData
): Promise<SubState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };
  const tid = session.user.tenantId;

  const slotId = String(formData.get("slotId") || "").trim();
  const teacherId = String(formData.get("teacherId") || "").trim();
  const classId = String(formData.get("classId") || "").trim();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const periodNo = Number(formData.get("periodNo"));

  if (!teacherId) return { error: "বিকল্প শিক্ষক (staff/user id) দিন" };

  try {
    let slot =
      slotId
        ? await prisma.timetableSlot.findFirst({
            where: { id: slotId, tenantId: tid },
          })
        : null;

    if (!slot && classId && !Number.isNaN(dayOfWeek) && !Number.isNaN(periodNo)) {
      slot = await prisma.timetableSlot.findFirst({
        where: {
          tenantId: tid,
          classId,
          dayOfWeek,
          periodNo,
        },
      });
    }

    if (!slot) return { error: "টাইমটেবল স্লট পাওয়া যায়নি" };

    await prisma.timetableSlot.update({
      where: { id: slot.id },
      data: { teacherId },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        tenantId: tid,
        userId: session.user.id,
        action: "UPDATE",
        entityType: "TimetableSlot",
        entityId: slot.id,
        newValues: { teacherId, reason: "substitute" },
      },
    });

    revalidatePath("/tenant/admin/timetable");
    return {
      success: true,
      message: `সাবস্টিটিউট সেট: period ${slot.periodNo}, day ${slot.dayOfWeek}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "আপডেট ব্যর্থ" };
  }
}
