"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type PromoteState = {
  error?: string;
  success?: boolean;
  promoted?: number;
  invoicesCreated?: number;
  message?: string;
};

async function tenantSession() {
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

export async function promoteBatchAction(
  _prev: PromoteState,
  formData: FormData
): Promise<PromoteState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const tenantId = session.user.tenantId;
  const fromClassId = String(formData.get("fromClassId") || "");
  const toClassId = String(formData.get("toClassId") || "");
  const toSectionIdRaw = String(formData.get("toSectionId") || "");
  const mode = String(formData.get("mode") || "all");
  const selected = formData.getAll("studentIds").map(String).filter(Boolean);
  const generateFees = formData.get("generateFees") === "on";
  const direction = String(formData.get("direction") || "promote"); // promote | demote

  if (!fromClassId || !toClassId) {
    return { error: "সোর্স ও টার্গেট ক্লাস আবশ্যক" };
  }
  if (fromClassId === toClassId) {
    return { error: "একই ক্লাসে সরানো যায় না" };
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

    let invoicesCreated = 0;
    if (generateFees && result.promoted > 0) {
      const inv = await financeRepository.generateInvoicesForClass({
        tenantId,
        classId: toClassId,
        batchNote: `PROMO-FEE-${toClassId}-${new Date().toISOString().slice(0, 10)}`,
      });
      invoicesCreated = inv.created;
    }

    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          action:
            direction === "demote"
              ? "STUDENT_BATCH_DEMOTE"
              : "STUDENT_BATCH_PROMOTE",
          entityType: "Class",
          entityId: fromClassId,
          newValues: {
            direction,
            fromClassId,
            toClassId,
            toSectionId: toSectionIdRaw || null,
            moved: result.promoted,
            invoicesCreated,
            mode,
          },
        },
      });
    } catch {
      /* optional */
    }

    const notify = formData.get("notify") !== "off";
    let smsSent = 0;
    if (notify && result.promoted > 0) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const fromNameSms = result.fromClass.nameBn || result.fromClass.name;
        const toNameSms = result.toClass.nameBn || result.toClass.name;
        const labelSms = direction === "demote" ? "ডিমোট" : "প্রমোট/ট্রান্সফার";
        const movedIds = result.studentIds || [];
        const students = movedIds.length
          ? await prisma.student.findMany({
              where: {
                id: { in: movedIds },
                tenantId,
              },
              select: {
                name: true,
                nameBn: true,
                studentId: true,
                fatherPhone: true,
                guardianPhone: true,
              },
            })
          : await prisma.student.findMany({
              where: {
                tenantId,
                currentClassId: toClassId,
                deletedAt: null,
                status: "ACTIVE",
              },
              select: {
                name: true,
                nameBn: true,
                studentId: true,
                fatherPhone: true,
                guardianPhone: true,
              },
              take: result.promoted,
            });
        for (const st of students) {
          const phone = st.guardianPhone || st.fatherPhone;
          if (!phone) continue;
          const body = `ক্লাস ${labelSms}: ${st.nameBn || st.name} (${st.studentId}) — ${fromNameSms} → ${toNameSms}।${generateFees ? " নতুন ফি চালান তৈরি হতে পারে।" : ""} — Edupro`;
          try {
            await communicationRepository.sendMessage({
              tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Class transfer",
              body,
              relatedType: "STUDENT_PROMOTE",
              relatedId: st.studentId,
            });
            smsSent += 1;
          } catch {
            /* continue */
          }
        }
      } catch (e) {
        console.error("promote SMS", e);
      }
    }

    revalidatePath("/tenant/admin/students");
    revalidatePath("/tenant/admin/students/promote");
    revalidatePath("/tenant/admin/finance");
    revalidatePath("/tenant/admin/communication");

    const fromName = result.fromClass.nameBn || result.fromClass.name;
    const toName = result.toClass.nameBn || result.toClass.name;
    const label = direction === "demote" ? "ডিমোট" : "প্রমোট";
    let message = `${result.promoted} জন ${label}: ${fromName} → ${toName}`;
    if (generateFees) {
      message += ` · ${invoicesCreated} টি ফি চালান তৈরি`;
    }
    if (notify) message += ` · SMS ${smsSent}`;

    return {
      success: true,
      promoted: result.promoted,
      invoicesCreated,
      message,
    };
  } catch (e) {
    console.error(e);
    return {
      error: e instanceof Error ? e.message : "অপারেশন ব্যর্থ",
    };
  }
}

/** Generate class fee invoices without moving students. */
export async function generateClassFeesAction(
  _prev: PromoteState,
  formData: FormData
): Promise<PromoteState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const classId = String(formData.get("classId") || "");
  if (!classId) return { error: "ক্লাস বাছুন" };

  try {
    const inv = await financeRepository.generateInvoicesForClass({
      tenantId: session.user.tenantId,
      classId,
      batchNote: `CLASS-FEE-${classId}-${new Date().toISOString().slice(0, 10)}`,
    });
    revalidatePath("/tenant/admin/finance");
    return {
      success: true,
      invoicesCreated: inv.created,
      message: `${inv.created} চালান তৈরি (স্কিপ ${inv.skipped}) · প্রতিজন ${inv.totalAmount} টাকা`,
    };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "চালান তৈরি ব্যর্থ" };
  }
}
