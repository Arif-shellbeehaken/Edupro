"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";

export type ExtState = { error?: string; success?: string };

async function withTenant() {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return null;
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });
  return session;
}

export async function createAlumniAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const name = String(fd.get("name") || "").trim();
  if (!name) return { error: "নাম প্রয়োজন" };
  await extendedOpsRepository.createAlumni({
    tenantId: s.user.tenantId,
    name,
    nameBn: String(fd.get("nameBn") || "") || undefined,
    phone: String(fd.get("phone") || "") || undefined,
    email: String(fd.get("email") || "") || undefined,
    graduationYear: Number(fd.get("graduationYear") || 0) || undefined,
    lastClass: String(fd.get("lastClass") || "") || undefined,
    currentJob: String(fd.get("currentJob") || "") || undefined,
    organization: String(fd.get("organization") || "") || undefined,
  });
  revalidatePath("/tenant/admin/alumni");
  return { success: "অ্যালামনাই যোগ হয়েছে" };
}

export async function upsertHealthAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const studentId = String(fd.get("studentId") || "");
  if (!studentId) return { error: "শিক্ষার্থী নির্বাচন করুন" };
  await extendedOpsRepository.upsertHealth({
    tenantId: s.user.tenantId,
    studentId,
    bloodGroup: String(fd.get("bloodGroup") || "") || undefined,
    allergies: String(fd.get("allergies") || "") || undefined,
    chronicConditions: String(fd.get("chronicConditions") || "") || undefined,
    vaccinations: String(fd.get("vaccinations") || "") || undefined,
    lastVisitNote: String(fd.get("lastVisitNote") || "") || undefined,
    emergencyContact: String(fd.get("emergencyContact") || "") || undefined,
    notes: String(fd.get("notes") || "") || undefined,
  });
  revalidatePath("/tenant/admin/health");
  return { success: "স্বাস্থ্য রেকর্ড সংরক্ষিত" };
}

export async function createNoticeAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const title = String(fd.get("title") || "").trim();
  const body = String(fd.get("body") || "").trim();
  if (!title || !body) return { error: "শিরোনাম ও বিবরণ প্রয়োজন" };
  await extendedOpsRepository.createNotice({
    tenantId: s.user.tenantId,
    title,
    titleBn: String(fd.get("titleBn") || "") || undefined,
    body,
    audience: String(fd.get("audience") || "ALL"),
  });
  revalidatePath("/tenant/admin/notices");
  return { success: "নোটিশ প্রকাশিত" };
}

export async function createSurveyAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const title = String(fd.get("title") || "").trim();
  if (!title) return { error: "শিরোনাম প্রয়োজন" };
  await extendedOpsRepository.createSurvey({
    tenantId: s.user.tenantId,
    title,
    description: String(fd.get("description") || "") || undefined,
    audience: String(fd.get("audience") || "PARENTS"),
  });
  revalidatePath("/tenant/admin/surveys");
  return { success: "সার্ভে তৈরি" };
}

export async function addSurveyResponseAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const surveyId = String(fd.get("surveyId") || "");
  if (!surveyId) return { error: "সার্ভে নির্বাচন করুন" };
  await extendedOpsRepository.addSurveyResponse({
    tenantId: s.user.tenantId,
    surveyId,
    respondent: String(fd.get("respondent") || "") || undefined,
    score: Number(fd.get("score") || 0) || undefined,
    comment: String(fd.get("comment") || "") || undefined,
  });
  revalidatePath("/tenant/admin/surveys");
  return { success: "রেসপন্স সংরক্ষিত" };
}

export async function createClubAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const name = String(fd.get("name") || "").trim();
  if (!name) return { error: "নাম প্রয়োজন" };
  await extendedOpsRepository.createClub({
    tenantId: s.user.tenantId,
    name,
    nameBn: String(fd.get("nameBn") || "") || undefined,
    category: String(fd.get("category") || "GENERAL"),
    coachName: String(fd.get("coachName") || "") || undefined,
  });
  revalidatePath("/tenant/admin/clubs");
  return { success: "ক্লাব তৈরি" };
}

export async function createMaterialAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const title = String(fd.get("title") || "").trim();
  if (!title) return { error: "শিরোনাম প্রয়োজন" };
  await extendedOpsRepository.createMaterial({
    tenantId: s.user.tenantId,
    title,
    className: String(fd.get("className") || "") || undefined,
    subject: String(fd.get("subject") || "") || undefined,
    materialType: String(fd.get("materialType") || "NOTE"),
    url: String(fd.get("url") || "") || undefined,
    body: String(fd.get("body") || "") || undefined,
  });
  revalidatePath("/tenant/admin/lms");
  return { success: "ম্যাটেরিয়াল যোগ হয়েছে" };
}
