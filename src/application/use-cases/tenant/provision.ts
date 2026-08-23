"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/infrastructure/auth/rbac";
import { tenantRepository } from "@/infrastructure/database/repositories/tenant-repository";
import { InstitutionType, SubscriptionPlan } from "@/domain/enums";
import { AppError, ConflictError } from "@/shared/errors";

const schema = z.object({
  name: z.string().min(2, "প্রতিষ্ঠানের নাম দিন"),
  nameBn: z.string().optional(),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন"),
  type: z.enum([
    "SCHOOL",
    "COLLEGE",
    "ALIA_MADRASAH",
    "QAWMI_MADRASAH",
    "MIXED",
  ]),
  plan: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).default("BASIC"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  division: z.string().optional(),
  adminName: z.string().min(2, "অ্যাডমিনের নাম দিন"),
  adminEmail: z.string().email("সঠিক অ্যাডমিন ইমেইল দিন"),
  adminPhone: z.string().optional(),
  adminPassword: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর"),
});

export type ProvisionTenantState = {
  error?: string;
  success?: boolean;
  tenantId?: string;
  slug?: string;
};

export async function provisionTenantAction(
  _prev: ProvisionTenantState,
  formData: FormData
): Promise<ProvisionTenantState> {
  try {
    await requireSuperAdmin();
  } catch {
    return { error: "শুধু সুপার অ্যাডমিন নতুন প্রতিষ্ঠান তৈরি করতে পারবেন" };
  }

  const raw = {
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    slug: formData.get("slug"),
    type: formData.get("type"),
    plan: formData.get("plan") || "BASIC",
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    district: formData.get("district") || undefined,
    division: formData.get("division") || undefined,
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPhone: formData.get("adminPhone") || undefined,
    adminPassword: formData.get("adminPassword"),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  const data = parsed.data;

  try {
    const result = await tenantRepository.provision({
      name: data.name,
      nameBn: data.nameBn,
      slug: data.slug,
      type: data.type as InstitutionType,
      plan: data.plan as SubscriptionPlan,
      email: data.email || undefined,
      phone: data.phone,
      address: data.address,
      district: data.district,
      division: data.division,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      adminPhone: data.adminPhone,
      adminPassword: data.adminPassword,
    });

    revalidatePath("/super-admin/tenants");
    revalidatePath("/super-admin/dashboard");

    return {
      success: true,
      tenantId: result.tenant.id,
      slug: result.tenant.slug,
    };
  } catch (e) {
    if (e instanceof ConflictError || e instanceof AppError) {
      return { error: e.message };
    }
    console.error("provisionTenant", e);
    return { error: "প্রতিষ্ঠান তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
