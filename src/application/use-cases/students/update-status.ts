"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type UpdateStatusState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const STATUSES = ["ACTIVE", "LEFT", "SUSPENDED", "GRADUATED", "TRANSFERRED"] as const;

export async function updateStudentStatusAction(
  _prev: UpdateStatusState,
  formData: FormData
): Promise<UpdateStatusState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const studentId = String(formData.get("studentId") || "");
  const status = String(formData.get("status") || "");
  if (!studentId || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return { error: "শিক্ষার্থী ও স্ট্যাটাস বাছুন" };
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        status: true,
        fatherPhone: true,
        guardianPhone: true,
      },
    });
    if (!student) return { error: "শিক্ষার্থী পাওয়া যায়নি" };

    await prisma.student.update({
      where: { id: student.id },
      data: { status },
    });

    let smsNote = "";
    if (
      (status === "LEFT" ||
        status === "SUSPENDED" ||
        status === "GRADUATED" ||
        status === "TRANSFERRED") &&
      (student.guardianPhone || student.fatherPhone)
    ) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const STATUS_BN: Record<string, string> = {
          LEFT: "প্রস্থান",
          SUSPENDED: "সাসপেন্ড",
          GRADUATED: "পাস/গ্র্যাজুয়েট",
          TRANSFERRED: "ট্রান্সফার",
          ACTIVE: "সক্রিয়",
        };
        const phone = student.guardianPhone || student.fatherPhone!;
        const body = `স্ট্যাটাস আপডেট: ${student.nameBn || student.name} (${student.studentId}) — ${STATUS_BN[status] || status}। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: `Student ${status}`,
          body,
          relatedType: "STUDENT_STATUS",
          relatedId: student.id,
        });
        smsNote = " · SMS";
      } catch (e) {
        console.error("student status SMS", e);
      }
    }

    revalidatePath("/tenant/admin/students");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `স্ট্যাটাস: ${status}${smsNote}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "স্ট্যাটাস আপডেট ব্যর্থ" };
  }
}
