"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";

const createSchema = z.object({
  staffId: z.string().min(1),
  leaveType: z.enum(["CASUAL", "SICK", "EARNED", "UNPAID", "MATERNITY", "OTHER"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
});

export type LeaveState = { error?: string; success?: boolean };

export async function createLeaveAction(
  _prev: LeaveState,
  formData: FormData
): Promise<LeaveState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = createSchema.safeParse({
    staffId: formData.get("staffId"),
    leaveType: formData.get("leaveType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (end < start) return { error: "শেষ তারিখ শুরুর আগে হতে পারে না" };

  try {
    await hrRepository.createLeave({
      tenantId: session.user.tenantId,
      staffId: parsed.data.staffId,
      leaveType: parsed.data.leaveType,
      startDate: start,
      endDate: end,
      reason: parsed.data.reason,
    });
    revalidatePath("/tenant/admin/hr/leave");
    revalidatePath("/tenant/admin/hr");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "ছুটির আবেদন জমা দেওয়া যায়নি" };
  }
}

const reviewSchema = z.object({
  leaveId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function reviewLeaveAction(
  _prev: LeaveState,
  formData: FormData
): Promise<LeaveState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = reviewSchema.safeParse({
    leaveId: formData.get("leaveId"),
    decision: formData.get("decision"),
    reviewNote: formData.get("reviewNote") || undefined,
  });

  if (!parsed.success) {
    return { error: "ইনপুট সঠিক নয়" };
  }

  try {
    const result = await hrRepository.reviewLeave({
      id: parsed.data.leaveId,
      tenantId: session.user.tenantId,
      status: parsed.data.decision,
      reviewedById: session.user.id,
      reviewNote: parsed.data.reviewNote,
    });
    if (result.count === 0) {
      return { error: "আবেদন পাওয়া যায়নি বা ইতিমধ্যে রিভিউ হয়েছে" };
    }
    revalidatePath("/tenant/admin/hr/leave");
    revalidatePath("/tenant/admin/hr");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "রিভিউ ব্যর্থ" };
  }
}
