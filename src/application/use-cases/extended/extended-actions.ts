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

/** Mark campus as active working context + audit + optional SMS */
export async function setActiveCampusAction(formData: FormData) {
  const session = await ctx();
  const campusId = String(formData.get("campusId") || "");
  if (!campusId || !session.user.tenantId) return;

  const { prisma } = await import("@/infrastructure/database/prisma");
  const { cookies } = await import("next/headers");

  const campus = await prisma.campus.findFirst({
    where: { id: campusId, tenantId: session.user.tenantId },
  });
  if (!campus) return;

  // Persist selection in cookie for UI filtering
  const jar = await cookies();
  jar.set("edupro_active_campus", campusId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "CAMPUS_SWITCH",
        entityType: "Campus",
        entityId: campusId,
        newValues: {
          campusId,
          name: campus.name,
          code: campus.code,
        },
      },
    });
  } catch (e) {
    console.error("campus audit", e);
  }

  // Notify campus phone or tenant admins
  try {
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    const phones = new Set<string>();
    if (campus.phone) phones.add(campus.phone);
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { phone: true },
    });
    if (tenant?.phone) phones.add(tenant.phone);

    const label = campus.nameBn || campus.name;
    const body = `ক্যাম্পাস সুইচ: ${session.user.name || "Admin"} এখন "${label}"${campus.code ? " (" + campus.code + ")" : ""} কনটেক্সটে কাজ করছেন। — Edupro`;
    for (const phone of phones) {
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Campus switch",
          body,
          relatedType: "CAMPUS",
          relatedId: campusId,
        });
      } catch {
        /* continue */
      }
    }
  } catch (e) {
    console.error("campus SMS", e);
  }

  revalidatePath("/tenant/admin/campuses");
  revalidatePath("/tenant/admin/dashboard");
  revalidatePath("/tenant/admin/audit");
  revalidatePath("/tenant/admin/communication");
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
  const subject = String(formData.get("subject") || "");
  const className = String(formData.get("className") || "") || undefined;
  const questionType = String(formData.get("questionType") || "MCQ");
  const difficulty = String(formData.get("difficulty") || "MEDIUM");
  const sendSms = formData.get("sendSms") === "on";

  const q = await extendedOpsRepository.createQuestion({
    tenantId: session.user.tenantId!,
    subject,
    className,
    questionType,
    questionText: String(formData.get("questionText") || ""),
    optionsJson: String(formData.get("optionsJson") || "") || undefined,
    correctAnswer: String(formData.get("correctAnswer") || "") || undefined,
    difficulty,
    marks: Number(formData.get("marks") || 1),
  });

  if (sendSms && session.user.tenantId) {
    try {
      const { prisma } = await import("@/infrastructure/database/prisma");
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      // Notify teaching staff
      const staff = await prisma.staff.findMany({
        where: {
          tenantId: session.user.tenantId,
          deletedAt: null,
          status: "ACTIVE",
        },
        select: { phone: true, designation: true },
        take: 100,
      });
      const phones = new Set<string>();
      for (const s of staff) {
        if (s.phone) phones.add(s.phone);
      }
      const cls = className ? ` · ${className}` : "";
      const body = `প্রশ্ন ব্যাংক: নতুন ${questionType} (${difficulty}) — বিষয়: ${subject}${cls}। ব্যাংকে যোগ হয়েছে। — Edupro`;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Question bank",
            body,
            relatedType: "QUESTION",
            relatedId:
              typeof q === "object" && q && "id" in q
                ? String((q as { id: string }).id)
                : undefined,
          });
        } catch {
          /* continue */
        }
      }
    } catch (e) {
      console.error("question SMS", e);
    }
  }

  revalidatePath("/tenant/admin/questions");
  revalidatePath("/tenant/admin/communication");
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
  const vehicleLabel = String(formData.get("vehicleLabel") || "");
  const logType = String(formData.get("logType") || "SERVICE");
  const driverPhone = String(formData.get("driverPhone") || "").trim() || undefined;
  const sendSms = formData.get("sendSms") === "on";
  const notes = String(formData.get("notes") || "") || undefined;

  const log = await extendedOpsRepository.createVehicleLog({
    tenantId: session.user.tenantId!,
    vehicleLabel,
    logType,
    amount: amount ? Number(amount) : undefined,
    odometer: odo ? Number(odo) : undefined,
    notes,
  });

  if (sendSms && driverPhone && session.user.tenantId) {
    try {
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const TYPE_BN: Record<string, string> = {
        SERVICE: "সার্ভিস",
        FUEL: "জ্বালানি",
        REPAIR: "মেরামত",
        INCIDENT: "ঘটনা",
        OTHER: "অন্যান্য",
      };
      const amt = amount ? ` · ৳${Number(amount).toLocaleString("en-BD")}` : "";
      const odoPart = odo ? ` · ওডো ${odo}` : "";
      const body = `যানবাহন লগ: ${vehicleLabel} — ${TYPE_BN[logType] || logType}${amt}${odoPart}${notes ? ". " + notes.slice(0, 60) : ""} — Edupro`;
      await communicationRepository.sendMessage({
        tenantId: session.user.tenantId,
        channel: "SMS",
        recipient: driverPhone,
        subject: "Vehicle log",
        body,
        relatedType: "VEHICLE",
        relatedId:
          typeof log === "object" && log && "id" in log
            ? String((log as { id: string }).id)
            : undefined,
      });
    } catch (e) {
      console.error("vehicle SMS", e);
    }
  }

  revalidatePath("/tenant/admin/vehicles");
  revalidatePath("/tenant/admin/communication");
}


/** Schedule a future emergency drill and SMS audience */
export async function scheduleEmergencyDrillAction(formData: FormData) {
  const session = await ctx();
  const tid = session.user.tenantId;
  if (!tid) return;

  const title = String(formData.get("title") || "ইমার্জেন্সি ড্রিল").trim();
  const message = String(formData.get("message") || "").trim();
  const drillAt = String(formData.get("drillAt") || "").trim();
  const audience = String(formData.get("audience") || "ALL");
  const sendSMS = formData.get("sendSMS") !== "off";
  if (!drillAt) return;

  const { prisma } = await import("@/infrastructure/database/prisma");

  const alert = await extendedOpsRepository.createEmergency({
    tenantId: tid,
    title: `[DRILL] ${title}`,
    message:
      message ||
      `ড্রিল নির্ধারিত: ${new Date(drillAt).toLocaleString("en-GB")}। অংশগ্রহণ বাধ্যতামূলক।`,
    severity: "MEDIUM",
    audience,
    createdById: session.user.id,
  });

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tid,
        userId: session.user.id,
        action: "EMERGENCY_DRILL",
        entityType: "EmergencyAlert",
        entityId: alert.id,
        newValues: { drillAt, audience, title },
      },
    });
  } catch {
    /* optional */
  }

  if (sendSMS) {
    try {
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const phones = new Set<string>();
      if (audience === "STAFF" || audience === "ALL") {
        const staff = await prisma.staff.findMany({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
          select: { phone: true },
          take: 200,
        });
        for (const s of staff) {
          if (s.phone) phones.add(s.phone);
        }
      }
      if (audience === "PARENTS" || audience === "ALL") {
        const students = await prisma.student.findMany({
          where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
          select: { guardianPhone: true, fatherPhone: true },
          take: 400,
        });
        for (const s of students) {
          const ph = s.guardianPhone || s.fatherPhone;
          if (ph) phones.add(ph);
        }
      }
      const when = new Date(drillAt).toLocaleString("en-GB");
      const body = `ইমার্জেন্সি ড্রিল: ${title} — সময় ${when}। ${message || "নিরাপত্তা নির্দেশনা অনুসরণ করুন।"} — Edupro`;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: tid,
            channel: "SMS",
            recipient: phone,
            subject: title,
            body: body.slice(0, 320),
            relatedType: "EMERGENCY_DRILL",
            relatedId: alert.id,
          });
        } catch {
          /* continue */
        }
      }
    } catch (e) {
      console.error("drill SMS", e);
    }
  }

  revalidatePath("/tenant/admin/emergency");
  revalidatePath("/tenant/admin/communication");
}


/** Lifecycle: asset condition / retire */
export async function updateAssetConditionAction(formData: FormData) {
  const session = await ctx();
  const id = String(formData.get("id") || "");
  const condition = String(formData.get("condition") || "GOOD");
  const retire = formData.get("retire") === "on";
  if (!id) return;
  await extendedOpsRepository.updateAssetCondition(
    id,
    condition,
    retire ? false : undefined
  );
  revalidatePath("/tenant/admin/assets");
}

export async function toggleCanteenItemAction(formData: FormData) {
  const session = await ctx();
  const id = String(formData.get("id") || "");
  const available = formData.get("available") === "true";
  if (!id) return;
  await extendedOpsRepository.setCanteenItemAvailability(id, available);
  revalidatePath("/tenant/admin/canteen");
}

export async function toggleJobActiveAction(formData: FormData) {
  const session = await ctx();
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await extendedOpsRepository.setJobActive(id, active);
  revalidatePath("/tenant/admin/career");
}

export async function updateAlumniAction(formData: FormData) {
  const session = await ctx();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await extendedOpsRepository.updateAlumni(id, {
    phone: String(formData.get("phone") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    currentJob: String(formData.get("currentJob") || "") || undefined,
    organization: String(formData.get("organization") || "") || undefined,
  });
  revalidatePath("/tenant/admin/alumni");
}

/** Canteen sale from menu item id — auto price */
export async function sellCanteenItemAction(formData: FormData) {
  const session = await ctx();
  const itemId = String(formData.get("itemId") || "");
  const qty = Math.max(1, Number(formData.get("quantity") || 1));
  const item = itemId
    ? await extendedOpsRepository.getCanteenItem(itemId)
    : null;
  const itemName = item?.name || String(formData.get("itemName") || "");
  const unit = item?.price ?? Number(formData.get("unitPrice") || 0);
  if (!itemName || unit <= 0) return;
  await extendedOpsRepository.createCanteenSale({
    tenantId: session.user.tenantId!,
    itemName,
    quantity: qty,
    unitPrice: unit,
    studentId: String(formData.get("studentId") || "") || undefined,
    paidVia: String(formData.get("paidVia") || "CASH"),
    note: String(formData.get("note") || "") || undefined,
  });
  revalidatePath("/tenant/admin/canteen");
}
