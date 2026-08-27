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

export type LeaveState = { error?: string; success?: boolean; message?: string };

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
    const { prisma } = await import("@/infrastructure/database/prisma");
    const leave = await prisma.leaveRequest.findFirst({
      where: {
        id: parsed.data.leaveId,
        tenantId: session.user.tenantId,
        status: "PENDING",
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            nameBn: true,
            employeeId: true,
            phone: true,
          },
        },
      },
    });
    if (!leave) {
      return { error: "আবেদন পাওয়া যায়নি বা ইতিমধ্যে রিভিউ হয়েছে" };
    }

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

    // Notify staff via SMS when phone is available
    if (leave.staff.phone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const statusBn =
          parsed.data.decision === "APPROVED" ? "অনুমোদিত" : "প্রত্যাখ্যাত";
        const start = leave.startDate.toLocaleDateString("en-GB");
        const end = leave.endDate.toLocaleDateString("en-GB");
        const body = `ছুটি ${statusBn}: ${leave.staff.nameBn || leave.staff.name} (${leave.staff.employeeId}) — ${leave.leaveType}, ${start}–${end} (${leave.days} দিন).${parsed.data.reviewNote ? " নোট: " + parsed.data.reviewNote : ""} — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: leave.staff.phone,
          subject: `Leave ${parsed.data.decision}`,
          body,
          relatedType: "LEAVE",
          relatedId: leave.id,
        });
      } catch (smsErr) {
        console.error("leave SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/hr/leave");
    revalidatePath("/tenant/admin/hr");
    revalidatePath("/tenant/admin/communication");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "রিভিউ ব্যর্থ" };
  }
}


/** SMS staff their remaining leave balance for the calendar year */
export async function notifyLeaveBalanceAction(
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

  const staffId = String(formData.get("staffId") || "") || undefined;
  const year = Number(formData.get("year") || new Date().getFullYear());
  const quotaCasual = Number(formData.get("quotaCasual") || 14);
  const quotaSick = Number(formData.get("quotaSick") || 10);

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const staffList = await prisma.staff.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        ...(staffId ? { id: staffId } : {}),
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        employeeId: true,
        phone: true,
      },
      take: staffId ? 1 : 200,
    });

    let sent = 0;
    for (const st of staffList) {
      if (!st.phone) continue;
      const approved = await prisma.leaveRequest.findMany({
        where: {
          tenantId: session.user.tenantId,
          staffId: st.id,
          status: "APPROVED",
          startDate: { gte: yearStart, lte: yearEnd },
        },
        select: { leaveType: true, days: true },
      });
      let usedCasual = 0;
      let usedSick = 0;
      let usedOther = 0;
      for (const lv of approved) {
        if (lv.leaveType === "CASUAL") usedCasual += lv.days;
        else if (lv.leaveType === "SICK") usedSick += lv.days;
        else usedOther += lv.days;
      }
      const remCasual = Math.max(0, quotaCasual - usedCasual);
      const remSick = Math.max(0, quotaSick - usedSick);
      const body = `ছুটি ব্যালেন্স ${year}: ${st.nameBn || st.name} (${st.employeeId}) — ক্যাজুয়াল বাকি ${remCasual}/${quotaCasual}, সিক বাকি ${remSick}/${quotaSick}${usedOther ? ", অন্যান্য ব্যবহৃত " + usedOther : ""} দিন। — Edupro`;
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: st.phone,
          subject: "Leave balance",
          body,
          relatedType: "LEAVE_BALANCE",
          relatedId: st.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/hr/leave");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `ছুটি ব্যালেন্স SMS ${sent}/${staffList.length}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ব্যালেন্স SMS ব্যর্থ" };
  }
}
