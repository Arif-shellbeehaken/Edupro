"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";

const schema = z.object({
  employeeId: z.string().min(1, "কর্মচারী আইডি দিন"),
  name: z.string().min(2, "নাম দিন"),
  nameBn: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  designation: z.string().min(1, "পদবি দিন"),
  department: z.string().optional(),
  roleType: z
    .enum(["TEACHER", "HIFZ_TEACHER", "ACCOUNTANT", "ADMIN", "SUPPORT"])
    .default("TEACHER"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).default("FULL_TIME"),
  joiningDate: z.string().optional(),
  basicSalary: z.coerce.number().int().min(0).default(0),
  houseRent: z.coerce.number().int().min(0).default(0),
  medicalAllow: z.coerce.number().int().min(0).default(0),
  otherAllow: z.coerce.number().int().min(0).default(0),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export type CreateStaffState = { error?: string; success?: boolean; message?: string };

export async function createStaffAction(
  _prev: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const parsed = schema.safeParse({
    employeeId: formData.get("employeeId"),
    name: formData.get("name"),
    nameBn: formData.get("nameBn") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    gender: formData.get("gender") || undefined,
    designation: formData.get("designation"),
    department: formData.get("department") || undefined,
    roleType: formData.get("roleType") || "TEACHER",
    employmentType: formData.get("employmentType") || "FULL_TIME",
    joiningDate: formData.get("joiningDate") || undefined,
    basicSalary: formData.get("basicSalary") || 0,
    houseRent: formData.get("houseRent") || 0,
    medicalAllow: formData.get("medicalAllow") || 0,
    otherAllow: formData.get("otherAllow") || 0,
    bankName: formData.get("bankName") || undefined,
    bankAccount: formData.get("bankAccount") || undefined,
    address: formData.get("address") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  try {
    await hrRepository.createStaff({
      tenantId: session.user.tenantId,
      ...parsed.data,
      email: parsed.data.email || undefined,
      joiningDate: parsed.data.joiningDate
        ? new Date(parsed.data.joiningDate)
        : undefined,
    });

    let smsNote = "";
    const notify = formData.get("notify") !== "off";
    if (notify && parsed.data.phone) {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          select: { name: true, nameBn: true },
        });
        const inst = tenant?.nameBn || tenant?.name || "প্রতিষ্ঠান";
        const body = `স্বাগতম: ${parsed.data.nameBn || parsed.data.name} (${parsed.data.employeeId}) — ${inst}-এ ${parsed.data.designation} হিসেবে যোগদান।${parsed.data.joiningDate ? " যোগদান: " + parsed.data.joiningDate + "." : ""} সফল কর্মজীবন কামনা করি। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: parsed.data.phone,
          subject: "Staff welcome",
          body,
          relatedType: "STAFF_WELCOME",
          relatedId: parsed.data.employeeId,
        });
        smsNote = " · Welcome SMS";
      } catch (e) {
        console.error("staff welcome SMS", e);
      }
    }

    revalidatePath("/tenant/admin/hr");
    revalidatePath("/tenant/admin/staff");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `স্টাফ যোগ${smsNote}` };
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { error: "এই কর্মচারী আইডি ইতিমধ্যে আছে" };
    }
    return { error: "স্টাফ যোগ করা যায়নি" };
  }
}
