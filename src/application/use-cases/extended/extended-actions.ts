"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";

async function ctx() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  return session;
}

export async function createCampusAction(formData: FormData) {
  const session = await ctx();
  await extendedOpsRepository.createCampus({
    tenantId: session.user.tenantId!,
    name: String(formData.get("name") || ""),
    nameBn: String(formData.get("nameBn") || "") || undefined,
    code: String(formData.get("code") || "") || undefined,
    address: String(formData.get("address") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    isMain: formData.get("isMain") === "on",
  });
  revalidatePath("/tenant/admin/campuses");
}

export async function createEmergencyAction(formData: FormData) {
  const session = await ctx();
  await extendedOpsRepository.createEmergency({
    tenantId: session.user.tenantId!,
    title: String(formData.get("title") || ""),
    message: String(formData.get("message") || ""),
    severity: String(formData.get("severity") || "HIGH"),
    audience: String(formData.get("audience") || "ALL"),
    createdById: session.user.id,
  });
  revalidatePath("/tenant/admin/emergency");
}

export async function resolveEmergencyAction(id: string) {
  await ctx();
  await extendedOpsRepository.resolveEmergency(id);
  revalidatePath("/tenant/admin/emergency");
}

export async function createJobAction(formData: FormData) {
  const session = await ctx();
  await extendedOpsRepository.createJob({
    tenantId: session.user.tenantId!,
    title: String(formData.get("title") || ""),
    company: String(formData.get("company") || "") || undefined,
    location: String(formData.get("location") || "") || undefined,
    jobType: String(formData.get("jobType") || "FULL_TIME"),
    description: String(formData.get("description") || "") || undefined,
    applyUrl: String(formData.get("applyUrl") || "") || undefined,
  });
  revalidatePath("/tenant/admin/career");
}

export async function createAssetAction(formData: FormData) {
  const session = await ctx();
  const pv = formData.get("purchaseValue");
  await extendedOpsRepository.createAsset({
    tenantId: session.user.tenantId!,
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || "GENERAL"),
    assetTag: String(formData.get("assetTag") || "") || undefined,
    location: String(formData.get("location") || "") || undefined,
    purchaseValue: pv ? Number(pv) : undefined,
    condition: String(formData.get("condition") || "GOOD"),
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidatePath("/tenant/admin/assets");
}

export async function createQuestionAction(formData: FormData) {
  const session = await ctx();
  await extendedOpsRepository.createQuestion({
    tenantId: session.user.tenantId!,
    subject: String(formData.get("subject") || ""),
    className: String(formData.get("className") || "") || undefined,
    questionType: String(formData.get("questionType") || "MCQ"),
    questionText: String(formData.get("questionText") || ""),
    optionsJson: String(formData.get("optionsJson") || "") || undefined,
    correctAnswer: String(formData.get("correctAnswer") || "") || undefined,
    difficulty: String(formData.get("difficulty") || "MEDIUM"),
    marks: Number(formData.get("marks") || 1),
  });
  revalidatePath("/tenant/admin/questions");
}
