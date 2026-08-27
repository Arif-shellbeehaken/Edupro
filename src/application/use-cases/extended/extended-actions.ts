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
  const title = String(formData.get("title") || "");
  const company = String(formData.get("company") || "") || undefined;
  const location = String(formData.get("location") || "") || undefined;
  const jobType = String(formData.get("jobType") || "FULL_TIME");
  const description = String(formData.get("description") || "") || undefined;
  const applyUrl = String(formData.get("applyUrl") || "") || undefined;
  const sendSms = formData.get("sendSms") === "on";

  const job = await extendedOpsRepository.createJob({
    tenantId: session.user.tenantId!,
    title,
    company,
    location,
    jobType,
    description,
    applyUrl,
  });

  if (sendSms && session.user.tenantId) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const phones = new Set<string>();
      // Prefer alumni phones; fallback guardian phones of senior students
      const alumni = await prisma.alumni.findMany({
        where: { tenantId: session.user.tenantId },
        select: { phone: true },
        take: 300,
      });
      for (const a of alumni) {
        if (a.phone) phones.add(a.phone);
      }
      if (phones.size < 5) {
        const students = await prisma.student.findMany({
          where: {
            tenantId: session.user.tenantId,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: { fatherPhone: true, guardianPhone: true },
          take: 200,
        });
        for (const s of students) {
          const ph = s.guardianPhone || s.fatherPhone;
          if (ph) phones.add(ph);
        }
      }
      const companyPart = company ? ` @ ${company}` : "";
      const loc = location ? `, ${location}` : "";
      const link = applyUrl ? ` আবেদন: ${applyUrl}` : "";
      const body = `চাকরি: ${title}${companyPart}${loc} (${jobType}).${link} — Edupro`;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: title,
            body,
            relatedType: "CAREER",
            relatedId:
              typeof job === "object" && job && "id" in job
                ? String((job as { id: string }).id)
                : undefined,
          });
        } catch {
          /* continue */
        }
      }
    } catch (e) {
      console.error("career SMS", e);
    }
  }

  revalidatePath("/tenant/admin/career");
  revalidatePath("/tenant/admin/communication");
}

export async function createAssetAction(formData: FormData) {
  const session = await ctx();
  const pv = formData.get("purchaseValue");
  const name = String(formData.get("name") || "");
  const assetTag = String(formData.get("assetTag") || "") || undefined;
  const location = String(formData.get("location") || "") || undefined;
  const assigneePhone = String(formData.get("assigneePhone") || "").trim() || undefined;
  const assigneeName = String(formData.get("assigneeName") || "").trim() || undefined;
  const sendSms = formData.get("sendSms") === "on";
  const notesParts = [
    String(formData.get("notes") || "") || "",
    assigneeName ? `Assigned: ${assigneeName}` : "",
    assigneePhone ? `Phone: ${assigneePhone}` : "",
  ].filter(Boolean);

  const asset = await extendedOpsRepository.createAsset({
    tenantId: session.user.tenantId!,
    name,
    category: String(formData.get("category") || "GENERAL"),
    assetTag,
    location,
    purchaseValue: pv ? Number(pv) : undefined,
    condition: String(formData.get("condition") || "GOOD"),
    notes: notesParts.join(" | ") || undefined,
  });

  if (sendSms && assigneePhone && session.user.tenantId) {
    try {
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const tag = assetTag ? ` (${assetTag})` : "";
      const loc = location ? ` · স্থান: ${location}` : "";
      const body = `অ্যাসেট অ্যাসাইন: ${name}${tag}${loc}${assigneeName ? " → " + assigneeName : ""}। যত্নসহ ব্যবহার করুন। — Edupro`;
      await communicationRepository.sendMessage({
        tenantId: session.user.tenantId,
        channel: "SMS",
        recipient: assigneePhone,
        subject: "Asset assignment",
        body,
        relatedType: "ASSET",
        relatedId:
          typeof asset === "object" && asset && "id" in asset
            ? String((asset as { id: string }).id)
            : undefined,
      });
    } catch (e) {
      console.error("asset SMS", e);
    }
  }

  revalidatePath("/tenant/admin/assets");
  revalidatePath("/tenant/admin/communication");
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
  const itemName = String(formData.get("itemName") || "");
  const studentId = String(formData.get("studentId") || "") || undefined;
  const paidVia = String(formData.get("paidVia") || "CASH");
  const sendSms = formData.get("sendSms") === "on";

  const sale = await extendedOpsRepository.createCanteenSale({
    tenantId: session.user.tenantId!,
    itemName,
    quantity: qty,
    unitPrice: unit,
    studentId,
    paidVia,
    note: String(formData.get("note") || "") || undefined,
  });

  if (sendSms && studentId && session.user.tenantId) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId: session.user.tenantId },
        select: {
          name: true,
          nameBn: true,
          studentId: true,
          fatherPhone: true,
          guardianPhone: true,
        },
      });
      const phone = student?.guardianPhone || student?.fatherPhone;
      if (phone && student) {
        const total = qty * unit;
        const body = `ক্যান্টিন: ${student.nameBn || student.name} (${student.studentId}) — ${itemName} × ${qty} = ৳${total.toLocaleString("en-BD")} (${paidVia})। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Canteen sale",
          body,
          relatedType: "CANTEEN",
          relatedId:
            typeof sale === "object" && sale && "id" in sale
              ? String((sale as { id: string }).id)
              : undefined,
        });
      }
    } catch (e) {
      console.error("canteen SMS", e);
    }
  }

  revalidatePath("/tenant/admin/canteen");
  revalidatePath("/tenant/admin/communication");
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
