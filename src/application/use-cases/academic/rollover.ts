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

    let smsNote = "";
    try {
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const phones = new Set<string>();
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { phone: true },
      });
      if (tenant?.phone) phones.add(tenant.phone);
      const admins = await prisma.user.findMany({
        where: {
          tenantId,
          role: { in: ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"] },
        },
        select: { phone: true },
        take: 10,
      });
      for (const a of admins) {
        if (a.phone) phones.add(a.phone);
      }
      const years = await prisma.academicYear.findMany({
        where: { id: { in: [fromYearId, toYearId] } },
        select: { id: true, name: true },
      });
      const fromName =
        years.find((y) => y.id === fromYearId)?.name || fromYearId;
      const toName = years.find((y) => y.id === toYearId)?.name || toYearId;
      const body = `একাডেমিক রোলওভার: ${fromName} → ${toName} · ক্লাস ${cloned}, শিক্ষার্থী ${moved}${
        setCurrent ? ", নতুন সেশন বর্তমান" : ""
      }। — Edupro`;
      let sent = 0;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Academic rollover",
            body,
            relatedType: "ACADEMIC_ROLLOVER",
            relatedId: toYearId,
          });
          sent += 1;
        } catch {
          /* continue */
        }
      }
      if (sent) smsNote = ` · SMS ${sent}`;
    } catch (smsErr) {
      console.error("rollover SMS", smsErr);
    }

    revalidatePath("/tenant/admin/academic/rollover");
    revalidatePath("/tenant/admin/students");
    revalidatePath("/tenant/admin/communication");

    return {
      success: true,
      message: `রোলওভার সম্পন্ন · ক্লাস ম্যাপ ${cloned} · শিক্ষার্থী স্থানান্তর ${moved}${
        setCurrent ? " · নতুন সেশন বর্তমান" : ""
      }${smsNote}`,
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
