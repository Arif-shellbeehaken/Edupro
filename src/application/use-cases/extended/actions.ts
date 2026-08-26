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
  const allergies = String(fd.get("allergies") || "") || undefined;
  const chronicConditions = String(fd.get("chronicConditions") || "") || undefined;
  const notifyGuardian = fd.get("notifyGuardian") === "on";
  const lastVisitNote = String(fd.get("lastVisitNote") || "") || undefined;

  await extendedOpsRepository.upsertHealth({
    tenantId: s.user.tenantId,
    studentId,
    bloodGroup: String(fd.get("bloodGroup") || "") || undefined,
    allergies,
    chronicConditions,
    vaccinations: String(fd.get("vaccinations") || "") || undefined,
    lastVisitNote,
    emergencyContact: String(fd.get("emergencyContact") || "") || undefined,
    notes: String(fd.get("notes") || "") || undefined,
  });

  let smsNote = "";
  if (notifyGuardian || allergies || chronicConditions || lastVisitNote) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId: s.user.tenantId },
        select: {
          name: true,
          nameBn: true,
          studentId: true,
          fatherPhone: true,
          guardianPhone: true,
        },
      });
      const phone = student?.guardianPhone || student?.fatherPhone;
      if (phone && student && (notifyGuardian || allergies || chronicConditions)) {
        const parts = [
          allergies ? `অ্যালার্জি: ${allergies}` : "",
          chronicConditions ? `দীর্ঘমেয়াদি: ${chronicConditions}` : "",
          lastVisitNote ? `ভিজিট: ${lastVisitNote.slice(0, 60)}` : "",
        ].filter(Boolean);
        const body = `স্বাস্থ্য আপডেট: ${student.nameBn || student.name} (${student.studentId})${parts.length ? " — " + parts.join("; ") : ""}। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: s.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Health update",
          body,
          relatedType: "HEALTH",
          relatedId: studentId,
        });
        smsNote = " · অভিভাবক SMS";
      }
    } catch (e) {
      console.error("health SMS", e);
    }
  }

  revalidatePath("/tenant/admin/health");
  revalidatePath("/tenant/admin/communication");
  return { success: `স্বাস্থ্য রেকর্ড সংরক্ষিত${smsNote}` };
}

export async function createNoticeAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const title = String(fd.get("title") || "").trim();
  const body = String(fd.get("body") || "").trim();
  const audience = String(fd.get("audience") || "ALL");
  const sendSms = fd.get("sendSms") === "on";
  if (!title || !body) return { error: "শিরোনাম ও বিবরণ প্রয়োজন" };

  const notice = await extendedOpsRepository.createNotice({
    tenantId: s.user.tenantId,
    title,
    titleBn: String(fd.get("titleBn") || "") || undefined,
    body,
    audience,
  });

  let smsNote = "";
  if (sendSms) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const phones = new Set<string>();
      const tid = s.user.tenantId;

      if (audience === "STAFF" || audience === "ALL") {
        const staff = await prisma.staff.findMany({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
          select: { phone: true },
          take: 300,
        });
        for (const st of staff) {
          if (st.phone) phones.add(st.phone);
        }
      }
      if (audience === "PARENTS" || audience === "STUDENTS" || audience === "ALL") {
        const students = await prisma.student.findMany({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
          select: { fatherPhone: true, guardianPhone: true },
          take: 500,
        });
        for (const st of students) {
          const ph = st.guardianPhone || st.fatherPhone;
          if (ph) phones.add(ph);
        }
      }

      const smsBody = `নোটিশ: ${title} — ${body.slice(0, 120)}${body.length > 120 ? "…" : ""} — Edupro`;
      let sent = 0;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: tid,
            channel: "SMS",
            recipient: phone,
            subject: title,
            body: smsBody,
            relatedType: "NOTICE",
            relatedId:
              typeof notice === "object" && notice && "id" in notice
                ? String((notice as { id: string }).id)
                : undefined,
          });
          sent += 1;
        } catch {
          /* continue */
        }
      }
      smsNote = ` · SMS ${sent}`;
    } catch (e) {
      console.error("notice SMS", e);
    }
  }

  revalidatePath("/tenant/admin/notices");
  revalidatePath("/tenant/admin/communication");
  return { success: `নোটিশ প্রকাশিত${smsNote}` };
}

export async function createSurveyAction(_p: ExtState, fd: FormData): Promise<ExtState> {
  const s = await withTenant();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const title = String(fd.get("title") || "").trim();
  if (!title) return { error: "শিরোনাম প্রয়োজন" };
  const audience = String(fd.get("audience") || "PARENTS");
  const description = String(fd.get("description") || "") || undefined;
  const sendSms = fd.get("sendSms") === "on";

  const survey = await extendedOpsRepository.createSurvey({
    tenantId: s.user.tenantId,
    title,
    description,
    audience,
  });

  let smsNote = "";
  if (sendSms) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const phones = new Set<string>();
      if (audience === "STAFF" || audience === "ALL") {
        const staff = await prisma.staff.findMany({
          where: { tenantId: s.user.tenantId, deletedAt: null, status: "ACTIVE" },
          select: { phone: true },
          take: 200,
        });
        for (const st of staff) {
          if (st.phone) phones.add(st.phone);
        }
      }
      if (audience === "PARENTS" || audience === "STUDENTS" || audience === "ALL") {
        const students = await prisma.student.findMany({
          where: { tenantId: s.user.tenantId, deletedAt: null, status: "ACTIVE" },
          select: { fatherPhone: true, guardianPhone: true },
          take: 500,
        });
        for (const st of students) {
          const ph = st.guardianPhone || st.fatherPhone;
          if (ph) phones.add(ph);
        }
      }
      const body = `সার্ভে: ${title}${description ? " — " + description.slice(0, 80) : ""}। অনুগ্রহ করে অংশ নিন। — Edupro`;
      let sent = 0;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: s.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: title,
            body,
            relatedType: "SURVEY",
            relatedId: typeof survey === "object" && survey && "id" in survey ? String((survey as { id: string }).id) : undefined,
          });
          sent += 1;
        } catch {
          /* continue */
        }
      }
      smsNote = ` · SMS ${sent}`;
    } catch (e) {
      console.error("survey SMS", e);
    }
  }

  revalidatePath("/tenant/admin/surveys");
  revalidatePath("/tenant/admin/communication");
  return { success: `সার্ভে তৈরি${smsNote}` };
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
