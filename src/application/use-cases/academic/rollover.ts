"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { academicRepository } from "@/infrastructure/database/repositories/academic-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type RolloverState = {
  error?: string;
  success?: boolean;
  message?: string;
};

async function sessionCtx() {
  const session = await auth();
  if (!session?.user?.tenantId) return null;
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  return session;
}

export async function createYearAction(
  _prev: RolloverState,
  formData: FormData
): Promise<RolloverState> {
  const session = await sessionCtx();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const name = String(formData.get("name") || "").trim();
  const nameBn = String(formData.get("nameBn") || "").trim() || undefined;
  const start = String(formData.get("startDate") || "");
  const end = String(formData.get("endDate") || "");
  const setCurrent = formData.get("setCurrent") === "on";

  if (!name || !start || !end) {
    return { error: "নাম, শুরু ও শেষ তারিখ আবশ্যক" };
  }

  try {
    const year = await academicRepository.createYear({
      tenantId: session.user.tenantId,
      name,
      nameBn,
      startDate: new Date(start),
      endDate: new Date(end),
      setCurrent,
    });
    revalidatePath("/tenant/admin/academic/rollover");
    return {
      success: true,
      message: `সেশন তৈরি: ${year.name}${setCurrent ? " (বর্তমান)" : ""}`,
    };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "সেশন তৈরি ব্যর্থ" };
  }
}

export async function rolloverAction(
  _prev: RolloverState,
  formData: FormData
): Promise<RolloverState> {
  const session = await sessionCtx();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const tenantId = session.user.tenantId;
  const fromYearId = String(formData.get("fromYearId") || "");
  const toYearId = String(formData.get("toYearId") || "");
  const cloneClasses = formData.get("cloneClasses") === "on";
  const moveStudents = formData.get("moveStudents") === "on";
  const setCurrent = formData.get("setCurrent") === "on";

  if (!fromYearId || !toYearId) {
    return { error: "সোর্স ও টার্গেট সেশন বাছুন" };
  }
  if (fromYearId === toYearId) {
    return { error: "আলাদা টার্গেট সেশন লাগবে" };
  }

  try {
    let classMap: Record<string, string> = {};
    let cloned = 0;
    let moved = 0;

    if (cloneClasses || moveStudents) {
      const result = await academicRepository.cloneClasses({
        tenantId,
        fromYearId,
        toYearId,
      });
      cloned = result.cloned;
      classMap = result.classMap;
    }

    if (moveStudents && Object.keys(classMap).length > 0) {
      const m = await academicRepository.migrateStudentsToYear({
        tenantId,
        fromYearId,
        toYearId,
        classMap,
      });
      moved = m.moved;
    }

    if (setCurrent) {
      await academicRepository.setCurrentYear(tenantId, toYearId);
    }

    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          action: "ACADEMIC_YEAR_ROLLOVER",
          entityType: "AcademicYear",
          entityId: toYearId,
          newValues: {
            fromYearId,
            toYearId,
            cloned,
            moved,
            setCurrent,
          },
        },
      });
    } catch {
      /* optional */
    }

    revalidatePath("/tenant/admin/academic/rollover");
    revalidatePath("/tenant/admin/students");

    return {
      success: true,
      message: `রোলওভার সম্পন্ন · ক্লাস ম্যাপ ${cloned} · শিক্ষার্থী স্থানান্তর ${moved}${
        setCurrent ? " · নতুন সেশন বর্তমান" : ""
      }`,
    };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "রোলওভার ব্যর্থ" };
  }
}

export async function setCurrentYearAction(yearId: string): Promise<RolloverState> {
  const session = await sessionCtx();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };
  try {
    await academicRepository.setCurrentYear(session.user.tenantId, yearId);
    revalidatePath("/tenant/admin/academic/rollover");
    return { success: true, message: "বর্তমান সেশন আপডেট" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ব্যর্থ" };
  }
}
