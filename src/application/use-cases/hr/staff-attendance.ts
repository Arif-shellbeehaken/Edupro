"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";

export type StaffAttendanceState = {
  error?: string;
  success?: string;
};

const markSchema = z.object({
  staffId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE", "HOLIDAY"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  remarks: z.string().optional(),
});

export async function markStaffAttendanceAction(
  _prev: StaffAttendanceState,
  formData: FormData
): Promise<StaffAttendanceState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = markSchema.safeParse({
    staffId: formData.get("staffId"),
    date: formData.get("date"),
    status: formData.get("status"),
    checkIn: formData.get("checkIn") || undefined,
    checkOut: formData.get("checkOut") || undefined,
    remarks: formData.get("remarks") || undefined,
  });
  if (!parsed.success) return { error: "সঠিক তথ্য দিন" };

  try {
    await hrRepository.upsertStaffAttendance({
      tenantId: session.user.tenantId,
      staffId: parsed.data.staffId,
      date: new Date(parsed.data.date),
      status: parsed.data.status,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
      remarks: parsed.data.remarks,
      markedById: session.user.id,
    });

    let smsNote = "";
    if (parsed.data.status === "LATE" || parsed.data.status === "ABSENT") {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const staff = await prisma.staff.findFirst({
          where: { id: parsed.data.staffId, tenantId: session.user.tenantId },
          select: {
            name: true,
            nameBn: true,
            employeeId: true,
            phone: true,
          },
        });
        if (staff?.phone) {
          const statusBn =
            parsed.data.status === "LATE" ? "লেট" : "অনুপস্থিত";
          const body = `স্টাফ উপস্থিতি: ${staff.nameBn || staff.name} (${staff.employeeId}) — ${parsed.data.date}: ${statusBn}${parsed.data.remarks ? ". " + parsed.data.remarks : ""}। — Edupro`;
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: staff.phone,
            subject: `Staff ${parsed.data.status}`,
            body,
            relatedType: "STAFF_ATTENDANCE",
            relatedId: staff.employeeId,
          });
          smsNote = " · SMS";
        }
      } catch (smsErr) {
        console.error("staff attendance SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/hr/attendance");
    revalidatePath("/tenant/admin/hr");
    revalidatePath("/tenant/admin/communication");
    return { success: `উপস্থিতি সংরক্ষিত${smsNote}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ত্রুটি" };
  }
}

export async function bulkMarkStaffAttendanceAction(
  _prev: StaffAttendanceState,
  formData: FormData
): Promise<StaffAttendanceState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const date = String(formData.get("date") || "");
  if (!date) return { error: "তারিখ প্রয়োজন" };

  const marks: { staffId: string; status: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("status_") && typeof value === "string") {
      const staffId = key.replace("status_", "");
      if (staffId && value) marks.push({ staffId, status: value });
    }
  }
  if (marks.length === 0) return { error: "কোনো মার্ক নেই" };

  try {
    await hrRepository.bulkMarkStaffAttendance({
      tenantId: session.user.tenantId,
      date: new Date(date),
      marks,
      markedById: session.user.id,
    });
    revalidatePath("/tenant/admin/hr/attendance");
    revalidatePath("/tenant/admin/hr");
    return { success: `${marks.length} জনের উপস্থিতি সংরক্ষিত` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ত্রুটি" };
  }
}
