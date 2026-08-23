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

export type UpsertSlotState = { error?: string; success?: boolean };

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

  try {
    await timetableRepository.upsertSlot({
      tenantId: session.user.tenantId,
      ...parsed.data,
    });
    revalidatePath("/tenant/admin/timetable");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "রুটিন স্লট সংরক্ষণ ব্যর্থ" };
  }
}
