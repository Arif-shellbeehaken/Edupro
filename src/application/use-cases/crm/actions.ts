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
  if (!id || !status) return { error: "ইনপুট অসম্পূর্ণ" };

  try {
    await crmRepository.updateLeadStatus({
      id,
      tenantId: session.user.tenantId,
      status,
      notes: (formData.get("notes") as string) || undefined,
    });
    revalidatePath("/tenant/admin/admission");
    return { success: true };
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
    revalidatePath("/tenant/admin/inventory");
    return { success: true, message: "স্টক আপডেট হয়েছে" };
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
