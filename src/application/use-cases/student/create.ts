"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { Gender } from "@/domain/enums";
import { ConflictError } from "@/shared/errors";

const schema = z.object({
  studentId: z.string().min(1, "স্টুডেন্ট আইডি দিন"),
  name: z.string().min(2, "নাম দিন"),
  nameBn: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  guardianPhone: z.string().optional(),
  isHifzStudent: z.string().optional(),
});

export type CreateStudentState = {
  error?: string;
  success?: boolean;
  studentId?: string;
};

export async function createStudentAction(
  _prev: CreateStudentState,
  formData: FormData
): Promise<CreateStudentState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) {
    return { error: "অনুমতি নেই" };
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = schema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    gender: formData.get("gender"),
    fatherName: formData.get("fatherName") || undefined,
    fatherPhone: formData.get("fatherPhone") || undefined,
    motherName: formData.get("motherName") || undefined,
    guardianPhone: formData.get("guardianPhone") || undefined,
    isHifzStudent: formData.get("isHifzStudent") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  try {
    const student = await studentRepository.create({
      tenantId: session.user.tenantId,
      studentId: parsed.data.studentId,
      name: parsed.data.name,
      nameBn: parsed.data.nameBn,
      gender: parsed.data.gender as Gender,
      fatherName: parsed.data.fatherName,
      fatherPhone: parsed.data.fatherPhone,
      motherName: parsed.data.motherName,
      guardianPhone: parsed.data.guardianPhone,
      isHifzStudent: parsed.data.isHifzStudent === "on" || parsed.data.isHifzStudent === "true",
    });

    revalidatePath("/tenant/admin/students");
    return { success: true, studentId: student.id };
  } catch (e) {
    if (e instanceof ConflictError) return { error: e.message };
    console.error(e);
    return { error: "শিক্ষার্থী যোগ করা যায়নি" };
  }
}
