"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { examRepository } from "@/infrastructure/database/repositories/exam-repository";

const schema = z.object({
  name: z.string().min(2, "পরীক্ষার নাম দিন"),
  nameBn: z.string().optional(),
  examType: z.enum(["CLASS_TEST", "MID_TERM", "FINAL", "BOARD", "HIFZ_TEST"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateExamState = { error?: string; success?: boolean };

export async function createExamAction(
  _prev: CreateExamState,
  formData: FormData
): Promise<CreateExamState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    examType: formData.get("examType"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  try {
    await examRepository.createExam({
      tenantId: session.user.tenantId,
      name: parsed.data.name,
      nameBn: parsed.data.nameBn,
      examType: parsed.data.examType,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    });
    revalidatePath("/tenant/admin/exams");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "পরীক্ষা তৈরি করা যায়নি" };
  }
}

const subjectSchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  code: z.string().optional(),
  fullMarks: z.coerce.number().int().positive().optional(),
});

export type CreateSubjectState = { error?: string; success?: boolean };

export async function createSubjectAction(
  _prev: CreateSubjectState,
  formData: FormData
): Promise<CreateSubjectState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    code: formData.get("code") || undefined,
    fullMarks: formData.get("fullMarks") || 100,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  try {
    await examRepository.createSubject({
      tenantId: session.user.tenantId,
      ...parsed.data,
    });
    revalidatePath("/tenant/admin/exams");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "বিষয় যোগ করা যায়নি (হয়তো আগে থেকে আছে)" };
  }
}

const markSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  marksObtained: z.coerce.number().min(0),
  fullMarks: z.coerce.number().positive().optional(),
});

export type EnterMarkState = { error?: string; success?: boolean };

export async function enterMarkAction(
  _prev: EnterMarkState,
  formData: FormData
): Promise<EnterMarkState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = markSchema.safeParse({
    examId: formData.get("examId"),
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    marksObtained: formData.get("marksObtained"),
    fullMarks: formData.get("fullMarks") || 100,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  try {
    await examRepository.upsertMark({
      tenantId: session.user.tenantId,
      ...parsed.data,
    });
    revalidatePath("/tenant/admin/exams");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "মার্ক এন্ট্রি ব্যর্থ" };
  }
}
