"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { crmRepository } from "@/infrastructure/database/repositories/crm-repository";
import { inventoryRepository } from "@/infrastructure/database/repositories/inventory-repository";
import { communicationRepository } from "@/infrastructure/database/repositories/communication-repository";

async function tenantSession() {
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

export type ActionState = { error?: string; success?: boolean; message?: string };

// ─── Admission CRM ───────────────────────────────────────────
export async function createLeadAction(
  _p: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const applicantName = (formData.get("applicantName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  if (!applicantName || !phone) return { error: "নাম ও ফোন আবশ্যক" };

  try {
    await crmRepository.createLead({
      tenantId: session.user.tenantId,
      applicantName,
      applicantNameBn: (formData.get("applicantNameBn") as string) || undefined,
      fatherName: (formData.get("fatherName") as string) || undefined,
      phone,
      email: (formData.get("email") as string) || undefined,
      gender: (formData.get("gender") as string) || undefined,
      applyingClass: (formData.get("applyingClass") as string) || undefined,
      source: (formData.get("source") as string) || "WALK_IN",
      notes: (formData.get("notes") as string) || undefined,
    });
    revalidatePath("/tenant/admin/admission");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "লিড তৈরি ব্যর্থ" };
  }
}

export async function updateLeadStatusAction(
  _p: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const id = formData.get("leadId") as string;
  const status = formData.get("status") as string;
  const notes = (formData.get("notes") as string) || undefined;
  if (!id || !status) return { error: "ইনপুট অসম্পূর্ণ" };

  const STATUS_BN: Record<string, string> = {
    NEW: "নতুন",
    CONTACTED: "যোগাযোগ করা হয়েছে",
    VISIT_SCHEDULED: "ভিজিট নির্ধারিত",
    DOCUMENTS: "ডকুমেন্ট পর্যায়",
    ADMITTED: "ভর্তি সম্পন্ন",
    REJECTED: "প্রত্যাখ্যাত",
    LOST: "হারিয়ে গেছে",
  };

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const lead = await prisma.admissionLead.findFirst({
      where: { id, tenantId: session.user.tenantId },
    });
    if (!lead) return { error: "লিড পাওয়া যায়নি" };

    await crmRepository.updateLeadStatus({
      id,
      tenantId: session.user.tenantId,
      status,
      notes,
    });

    let smsNote = "";
    if (lead.phone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const statusBn = STATUS_BN[status] || status;
        const cls = lead.applyingClass ? ` ক্লাস: ${lead.applyingClass}.` : "";
        const body = `ভর্তি আপডেট: ${lead.applicantNameBn || lead.applicantName} — স্ট্যাটাস: ${statusBn}.${cls}${notes ? " নোট: " + notes : ""} — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: lead.phone,
          subject: `Admission ${status}`,
          body,
          relatedType: "ADMISSION",
          relatedId: lead.id,
        });
        smsNote = " · SMS পাঠানো হয়েছে";
      } catch (smsErr) {
        console.error("admission SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/admission");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `স্ট্যাটাস আপডেট${smsNote}` };
  } catch (e) {
    console.error(e);
    return { error: "স্ট্যাটাস আপডেট ব্যর্থ" };
  }
}

// ─── Inventory ───────────────────────────────────────────────
export async function createInventoryItemAction(
  _p: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "আইটেমের নাম দিন" };

  try {
    await inventoryRepository.createItem({
      tenantId: session.user.tenantId,
      name,
      nameBn: (formData.get("nameBn") as string) || undefined,
      sku: (formData.get("sku") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      unit: (formData.get("unit") as string) || "pcs",
      quantity: Number(formData.get("quantity") || 0),
      minStock: Number(formData.get("minStock") || 5),
      unitCost: Number(formData.get("unitCost") || 0),
      location: (formData.get("location") as string) || undefined,
    });
    revalidatePath("/tenant/admin/inventory");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { error: "SKU ইতিমধ্যে আছে" };
    }
    return { error: "আইটেম যোগ ব্যর্থ" };
  }
}

export async function stockTxnAction(
  _p: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const itemId = formData.get("itemId") as string;
  const type = formData.get("type") as "IN" | "OUT" | "ADJUST";
  const quantity = Number(formData.get("quantity") || 0);
  if (!itemId || !type || quantity < 0) return { error: "ইনপুট সঠিক নয়" };

  try {
    await inventoryRepository.stockTxn({
      tenantId: session.user.tenantId,
      itemId,
      type,
      quantity,
      note: (formData.get("note") as string) || undefined,
      performedById: session.user.id,
    });

    let smsNote = "";
    if (type === "OUT" || type === "ADJUST") {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const item = await prisma.inventoryItem.findFirst({
          where: { id: itemId, tenantId: session.user.tenantId },
        });
        if (item && item.quantity <= item.minStock) {
          const phones = new Set<string>();
          const staff = await prisma.staff.findMany({
            where: {
              tenantId: session.user.tenantId,
              deletedAt: null,
              status: "ACTIVE",
            },
            select: { phone: true, roleType: true },
            take: 40,
          });
          for (const s of staff) {
            if (
              s.phone &&
              (!s.roleType ||
                ["ADMIN", "ACCOUNTANT", "SUPPORT", "STORE"].includes(s.roleType))
            ) {
              phones.add(s.phone);
            }
          }
          const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { phone: true },
          });
          if (tenant?.phone) phones.add(tenant.phone);

          const body = `স্টক-আউট অ্যালার্ট: ${item.nameBn || item.name} এখন ${item.quantity} (মিন ${item.minStock})। পুনরায় অর্ডার করুন। — Edupro`;
          let sent = 0;
          for (const phone of phones) {
            try {
              await communicationRepository.sendMessage({
                tenantId: session.user.tenantId,
                channel: "SMS",
                recipient: phone,
                subject: "Stock out",
                body,
                relatedType: "INVENTORY_STOCKOUT",
                relatedId: item.id,
              });
              sent += 1;
            } catch {
              /* continue */
            }
          }
          if (sent > 0) smsNote = ` · লো-স্টক SMS ${sent}`;
        }
      } catch (smsErr) {
        console.error("stockout SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/inventory");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `স্টক আপডেট হয়েছে${smsNote}` };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "স্টক আপডেট ব্যর্থ" };
  }
}

// ─── Communication ───────────────────────────────────────────
export async function sendMessageAction(
  _p: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const channel = (formData.get("channel") as string) || "SMS";
  const body = (formData.get("body") as string)?.trim();
  const bulk = formData.get("bulk") === "true";

  if (!body) return { error: "মেসেজ লিখুন" };

  const classId = (formData.get("classId") as string)?.trim() || "";

  try {
    if (bulk) {
      if (classId) {
        const result = await communicationRepository.bulkSmsToClass({
          tenantId: session.user.tenantId,
          classId,
          body,
          subject: (formData.get("subject") as string) || undefined,
        });
        revalidatePath("/tenant/admin/communication");
        return {
          success: true,
          message: `ক্লাস SMS: ${result.sent}/${result.targeted} জন (লগ ${result.logs.length})`,
        };
      }
      const logs = await communicationRepository.bulkSmsToStudents({
        tenantId: session.user.tenantId,
        body,
        subject: (formData.get("subject") as string) || undefined,
      });
      revalidatePath("/tenant/admin/communication");
      return {
        success: true,
        message: `${logs.length} জন অভিভাবককে SMS পাঠানো হয়েছে (লগ)`,
      };
    }

    const recipient = (formData.get("recipient") as string)?.trim();
    if (!recipient) return { error: "প্রাপক দিন" };

    await communicationRepository.sendMessage({
      tenantId: session.user.tenantId,
      channel,
      recipient,
      subject: (formData.get("subject") as string) || undefined,
      body,
    });
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: "মেসেজ পাঠানো হয়েছে (লগ)" };
  } catch (e) {
    console.error(e);
    return { error: "মেসেজ পাঠানো ব্যর্থ" };
  }
}

export async function createNoticeAction(
  _p: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  if (!title || !body) return { error: "শিরোনাম ও বিবরণ দিন" };

  try {
    await communicationRepository.createNotice({
      tenantId: session.user.tenantId,
      title,
      titleBn: (formData.get("titleBn") as string) || undefined,
      body,
      audience: (formData.get("audience") as string) || "ALL",
    });
    revalidatePath("/tenant/admin/communication");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "নোটিশ তৈরি ব্যর্থ" };
  }
}


export async function notifyLowStockAction(
  _p: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  try {
    const { inventoryRepository } = await import(
      "@/infrastructure/database/repositories/inventory-repository"
    );
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    const { prisma } = await import("@/infrastructure/database/prisma");

    const low = await inventoryRepository.lowStockItems(session.user.tenantId);
    if (low.length === 0) return { error: "লো-স্টক আইটেম নেই" };

    // Notify active admin/accountant staff + tenant phone
    const phones = new Set<string>();
    const staff = await prisma.staff.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        roleType: { in: ["ADMIN", "ACCOUNTANT", "SUPPORT"] },
      },
      select: { phone: true },
      take: 50,
    });
    for (const s of staff) {
      if (s.phone) phones.add(s.phone);
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { phone: true },
    });
    if (tenant?.phone) phones.add(tenant.phone);

    if (phones.size === 0) {
      return { error: "নোটিফাই করার মতো ফোন নেই (স্টাফ/প্রতিষ্ঠান)" };
    }

    const lines = low
      .slice(0, 8)
      .map((i) => `${i.nameBn || i.name}: ${i.quantity}/${i.minStock}`)
      .join("; ");
    const body = `লো-স্টক অ্যালার্ট (${low.length} আইটেম): ${lines} — Edupro`;

    let sent = 0;
    for (const phone of phones) {
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Low stock alert",
          body,
          relatedType: "INVENTORY",
          relatedId: low[0]?.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/inventory");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `লো-স্টক SMS ${sent} জনকে · ${low.length} আইটেম`,
    };
  } catch (e) {
    console.error(e);
    return { error: "লো-স্টক অ্যালার্ট ব্যর্থ" };
  }
}
