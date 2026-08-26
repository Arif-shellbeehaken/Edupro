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
  const title = String(formData.get("title") || "");
  const message = String(formData.get("message") || "");
  const severity = String(formData.get("severity") || "HIGH");
  const audience = String(formData.get("audience") || "ALL");
  const sendSms = formData.get("sendSms") === "on";

  const alert = await extendedOpsRepository.createEmergency({
    tenantId: session.user.tenantId!,
    title,
    message,
    severity,
    audience,
    createdById: session.user.id,
  });

  if (sendSms && session.user.tenantId) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const tid = session.user.tenantId;
      const phones = new Set<string>();

      if (audience === "STAFF" || audience === "ALL") {
        const staff = await prisma.staff.findMany({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
          select: { phone: true },
          take: 300,
        });
        for (const s of staff) {
          if (s.phone) phones.add(s.phone);
        }
      }
      if (audience === "PARENTS" || audience === "ALL" || audience === "STUDENTS") {
        const students = await prisma.student.findMany({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
          select: { fatherPhone: true, guardianPhone: true },
          take: 500,
        });
        for (const s of students) {
          const ph = s.guardianPhone || s.fatherPhone;
          if (ph) phones.add(ph);
        }
      }

      const body = `🚨 ইমার্জেন্সি [${severity}]: ${title} — ${message} — Edupro`;
      let sent = 0;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: tid,
            channel: "SMS",
            recipient: phone,
            subject: title,
            body,
            relatedType: "EMERGENCY",
            relatedId: alert.id,
          });
          sent += 1;
        } catch {
          /* continue */
        }
      }
      console.info(`emergency SMS sent ${sent}/${phones.size}`);
    } catch (e) {
      console.error("emergency SMS", e);
    }
  }

  revalidatePath("/tenant/admin/emergency");
  revalidatePath("/tenant/admin/communication");
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

export async function createCanteenItemAction(formData: FormData) {
  const session = await ctx();
  await extendedOpsRepository.createCanteenItem({
    tenantId: session.user.tenantId!,
    name: String(formData.get("name") || ""),
    nameBn: String(formData.get("nameBn") || "") || undefined,
    price: Number(formData.get("price") || 0),
    category: String(formData.get("category") || "MEAL"),
  });
  revalidatePath("/tenant/admin/canteen");
}

export async function createCanteenSaleAction(formData: FormData) {
  const session = await ctx();
  const qty = Number(formData.get("quantity") || 1);
  const unit = Number(formData.get("unitPrice") || 0);
  await extendedOpsRepository.createCanteenSale({
    tenantId: session.user.tenantId!,
    itemName: String(formData.get("itemName") || ""),
    quantity: qty,
    unitPrice: unit,
    studentId: String(formData.get("studentId") || "") || undefined,
    paidVia: String(formData.get("paidVia") || "CASH"),
    note: String(formData.get("note") || "") || undefined,
  });
  revalidatePath("/tenant/admin/canteen");
}

export async function createVehicleLogAction(formData: FormData) {
  const session = await ctx();
  const amount = formData.get("amount");
  const odo = formData.get("odometer");
  await extendedOpsRepository.createVehicleLog({
    tenantId: session.user.tenantId!,
    vehicleLabel: String(formData.get("vehicleLabel") || ""),
    logType: String(formData.get("logType") || "SERVICE"),
    amount: amount ? Number(amount) : undefined,
    odometer: odo ? Number(odo) : undefined,
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidatePath("/tenant/admin/vehicles");
}
