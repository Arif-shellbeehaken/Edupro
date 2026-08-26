"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedRepository } from "@/infrastructure/database/repositories/extended-repository";

async function session() {
  const s = await requireTenantContext().catch(() => null);
  if (!s?.user.tenantId) return null;
  setTenantContext({
    tenantId: s.user.tenantId,
    userId: s.user.id,
    role: s.user.role,
    isSuperAdmin: false,
  });
  return s;
}

export type ExtState = { error?: string; success?: boolean; message?: string };

export async function createDonationAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };

  const donorName = (formData.get("donorName") as string)?.trim();
  const amount = Number(formData.get("amount") || 0);
  if (!donorName || amount <= 0) return { error: "দাতার নাম ও পরিমাণ দিন" };

  const donorPhone = (formData.get("donorPhone") as string)?.trim() || undefined;
  const category = (formData.get("category") as string) || "GENERAL";
  const method = (formData.get("method") as string) || undefined;

  try {
    const d = await extendedRepository.createDonation({
      tenantId: s.user.tenantId,
      donorName,
      donorPhone,
      amount,
      category,
      method,
      notes: (formData.get("notes") as string) || undefined,
      receivedById: s.user.id,
    });
    await extendedRepository.writeAudit({
      tenantId: s.user.tenantId,
      userId: s.user.id,
      action: "CREATE",
      entityType: "Donation",
      entityId: d.id,
      newValues: { amount, category: d.category, receiptNo: d.receiptNo },
    });

    let smsNote = "";
    if (donorPhone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const catBn: Record<string, string> = {
          ZAKAT: "যাকাত",
          SADAQAH: "সদকা",
          GENERAL: "সাধারণ",
          SPONSORSHIP: "স্পন্সরশিপ",
          WAQF: "ওয়াকফ",
        };
        const body = `দান রসিদ: ${donorName} — ৳${amount.toLocaleString("en-BD")} (${catBn[category] || category}), রসিদ ${d.receiptNo}${method ? ", " + method : ""}। জাজাকাল্লাহু খাইরান। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: s.user.tenantId,
          channel: "SMS",
          recipient: donorPhone,
          subject: "Donation receipt",
          body,
          relatedType: "DONATION",
          relatedId: d.id,
        });
        smsNote = " · SMS রসিদ পাঠানো হয়েছে";
      } catch (smsErr) {
        console.error("donation SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/donations");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `রসিদ: ${d.receiptNo}${smsNote}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ডোনেশন সংরক্ষণ ব্যর্থ" };
  }
}

export async function checkInVisitorAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };

  const visitorName = (formData.get("visitorName") as string)?.trim();
  if (!visitorName) return { error: "ভিজিটরের নাম দিন" };

  const hostName = (formData.get("hostName") as string)?.trim() || undefined;
  const hostPhone = (formData.get("hostPhone") as string)?.trim() || undefined;
  const purpose = (formData.get("purpose") as string)?.trim() || undefined;
  const visitorPhone =
    (formData.get("visitorPhone") as string)?.trim() || undefined;

  try {
    const log = await extendedRepository.checkInVisitor({
      tenantId: s.user.tenantId,
      visitorName,
      visitorPhone,
      purpose,
      hostName,
      vehicleNo: (formData.get("vehicleNo") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    let smsNote = "";
    if (hostPhone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const body = `গেট নোটিশ: ${visitorName}${visitorPhone ? " (" + visitorPhone + ")" : ""} আপনার সাথে দেখা করতে এসেছেন${purpose ? " — " + purpose : ""}। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: s.user.tenantId,
          channel: "SMS",
          recipient: hostPhone,
          subject: "Visitor check-in",
          body,
          relatedType: "GATE",
          relatedId: log.id,
        });
        smsNote = " · হোস্ট SMS পাঠানো হয়েছে";
      } catch (smsErr) {
        console.error("gate SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/gate");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `চেক-ইন সম্পন্ন${smsNote}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "চেক-ইন ব্যর্থ" };
  }
}

export async function checkOutVisitorAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const id = formData.get("visitorId") as string;
  if (!id) return { error: "আইডি দরকার" };
  try {
    await extendedRepository.checkOutVisitor(id, s.user.tenantId);
    revalidatePath("/tenant/admin/gate");
    return { success: true };
  } catch (e) {
    return { error: "চেক-আউট ব্যর্থ" };
  }
}

export async function createGrievanceAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };

  const subject = (formData.get("subject") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!subject || !description) return { error: "বিষয় ও বিবরণ দিন" };

  try {
    await extendedRepository.createGrievance({
      tenantId: s.user.tenantId,
      submittedBy: (formData.get("submittedBy") as string) || undefined,
      contactPhone: (formData.get("contactPhone") as string) || undefined,
      category: (formData.get("category") as string) || "GENERAL",
      subject,
      description,
      priority: (formData.get("priority") as string) || "MEDIUM",
    });
    revalidatePath("/tenant/admin/grievance");
    return { success: true };
  } catch (e) {
    return { error: "অভিযোগ জমা ব্যর্থ" };
  }
}

export async function updateGrievanceAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const id = formData.get("grievanceId") as string;
  const status = formData.get("status") as string;
  const resolution = (formData.get("resolution") as string) || undefined;
  if (!id || !status) return { error: "ইনপুট অসম্পূর্ণ" };

  const STATUS_BN: Record<string, string> = {
    OPEN: "খোলা",
    IN_PROGRESS: "চলমান",
    RESOLVED: "সমাধান",
    CLOSED: "বন্ধ",
  };

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const g = await prisma.grievance.findFirst({
      where: { id, tenantId: s.user.tenantId },
    });
    if (!g) return { error: "অভিযোগ পাওয়া যায়নি" };

    await extendedRepository.updateGrievanceStatus({
      id,
      tenantId: s.user.tenantId,
      status,
      resolution,
    });

    let smsNote = "";
    if (g.contactPhone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const statusBn = STATUS_BN[status] || status;
        const body = `অভিযোগ আপডেট: "${g.subject}" — স্ট্যাটাস: ${statusBn}.${resolution ? " সমাধান: " + resolution : ""} — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: s.user.tenantId,
          channel: "SMS",
          recipient: g.contactPhone,
          subject: `Grievance ${status}`,
          body,
          relatedType: "GRIEVANCE",
          relatedId: g.id,
        });
        smsNote = " · SMS পাঠানো হয়েছে";
      } catch (smsErr) {
        console.error("grievance SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/grievance");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `আপডেট সম্পন্ন${smsNote}` };
  } catch (e) {
    return { error: "আপডেট ব্যর্থ" };
  }
}

export async function createHomeworkAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "শিরোনাম দিন" };
  try {
    await extendedRepository.createHomework({
      tenantId: s.user.tenantId,
      title,
      description: (formData.get("description") as string) || undefined,
      subjectName: (formData.get("subjectName") as string) || undefined,
      classId: (formData.get("classId") as string) || undefined,
      dueDate: formData.get("dueDate")
        ? new Date(formData.get("dueDate") as string)
        : undefined,
      assignedById: s.user.id,
    });
    revalidatePath("/tenant/admin/homework");
    return { success: true };
  } catch (e) {
    return { error: "হোমওয়ার্ক তৈরি ব্যর্থ" };
  }
}

export async function notifyHomeworkAction(
  _p: ExtState,
  formData: FormData
): Promise<ExtState> {
  const s = await session();
  if (!s?.user.tenantId) return { error: "অনুমতি নেই" };

  const homeworkId = (formData.get("homeworkId") as string)?.trim();
  if (!homeworkId) return { error: "হোমওয়ার্ক বাছুন" };

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    const hw = await prisma.homework.findFirst({
      where: { id: homeworkId, tenantId: s.user.tenantId },
    });
    if (!hw) return { error: "হোমওয়ার্ক পাওয়া যায়নি" };

    const students = await prisma.student.findMany({
      where: {
        tenantId: s.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        ...(hw.classId ? { currentClassId: hw.classId } : {}),
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
      },
      take: 500,
    });

    const due = hw.dueDate
      ? hw.dueDate.toLocaleDateString("en-GB")
      : "শীঘ্রই";
    const subj = hw.subjectName || "হোমওয়ার্ক";
    let sent = 0;

    for (const st of students) {
      const phone = st.guardianPhone || st.fatherPhone;
      if (!phone) continue;
      const body = `হোমওয়ার্ক: ${hw.title} (${subj}) — ${st.nameBn || st.name} (${st.studentId}) এর জন্য ডিউ ${due}। — Edupro`;
      try {
        await communicationRepository.sendMessage({
          tenantId: s.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: hw.title,
          body,
          relatedType: "HOMEWORK",
          relatedId: hw.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/homework");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `${sent}/${students.length} জন অভিভাবককে রিমাইন্ডার পাঠানো হয়েছে`,
    };
  } catch (e) {
    console.error(e);
    return { error: "হোমওয়ার্ক SMS ব্যর্থ" };
  }
}
