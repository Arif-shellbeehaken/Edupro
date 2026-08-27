"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type IdCardState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function notifyIdCardsReadyAction(
  _prev: IdCardState,
  formData: FormData
): Promise<IdCardState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const classId = String(formData.get("classId") || "") || undefined;
  const studentId = String(formData.get("studentId") || "") || undefined;

  try {
    const students = await prisma.student.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        ...(studentId ? { id: studentId } : {}),
        ...(classId ? { currentClassId: classId } : {}),
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
      },
      take: studentId ? 1 : 300,
    });

    if (students.length === 0) return { error: "শিক্ষার্থী নেই" };

    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    let sent = 0;
    for (const st of students) {
      const phone = st.guardianPhone || st.fatherPhone;
      if (!phone) continue;
      const body = `আইডি কার্ড প্রস্তুত: ${st.nameBn || st.name} (${st.studentId})। অফিস থেকে সংগ্রহ করুন / প্রিন্ট: /tenant/admin/students/id-cards — Edupro`;
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "ID card ready",
          body,
          relatedType: "ID_CARD",
          relatedId: st.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/students/id-cards");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `আইডি কার্ড SMS ${sent}/${students.length}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "আইডি কার্ড SMS ব্যর্থ" };
  }
}
