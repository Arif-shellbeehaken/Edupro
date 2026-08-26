"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type PromoteState = {
  error?: string;
  success?: boolean;
  promoted?: number;
  message?: string;
};

export async function promoteBatchAction(
  _prev: PromoteState,
  formData: FormData
): Promise<PromoteState> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { error: "অনুমতি নেই" };
  }

  const tenantId = session.user.tenantId;
  setTenantContext({
    tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });

  const fromClassId = String(formData.get("fromClassId") || "");
  const toClassId = String(formData.get("toClassId") || "");
  const toSectionIdRaw = String(formData.get("toSectionId") || "");
  const mode = String(formData.get("mode") || "all"); // all | selected
  const selected = formData.getAll("studentIds").map(String).filter(Boolean);

  if (!fromClassId || !toClassId) {
    return { error: "সোর্স ও টার্গেট ক্লাস আবশ্যক" };
  }
  if (fromClassId === toClassId) {
    return { error: "একই ক্লাসে প্রমোশন করা যায় না" };
  }
  if (mode === "selected" && selected.length === 0) {
    return { error: "অন্তত একজন শিক্ষার্থী সিলেক্ট করুন" };
  }

  try {
    const result = await studentRepository.promoteBatch({
      tenantId,
      fromClassId,
      toClassId,
      studentIds: mode === "selected" ? selected : undefined,
      toSectionId: toSectionIdRaw || null,
    });

    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          action: "STUDENT_BATCH_PROMOTE",
          entityType: "Class",
          entityId: fromClassId,
          newValues: {
            fromClassId,
            toClassId,
            toSectionId: toSectionIdRaw || null,
            promoted: result.promoted,
            mode,
          },
        },
      });
    } catch {
      /* audit optional */
    }

    revalidatePath("/tenant/admin/students");
    revalidatePath("/tenant/admin/students/promote");

    const fromName = result.fromClass.nameBn || result.fromClass.name;
    const toName = result.toClass.nameBn || result.toClass.name;
    return {
      success: true,
      promoted: result.promoted,
      message: `${result.promoted} জন: ${fromName} → ${toName}`,
    };
  } catch (e) {
    console.error(e);
    return {
      error: e instanceof Error ? e.message : "প্রমোশন ব্যর্থ",
    };
  }
}
