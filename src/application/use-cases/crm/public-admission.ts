"use server";

import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";

export type PublicAdmissionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const schema = z.object({
  tenantSlug: z.string().min(1),
  applicantName: z.string().min(2),
  phone: z.string().min(10),
  fatherName: z.string().optional(),
  applyingClass: z.string().optional(),
  previousSchool: z.string().optional(),
  notes: z.string().optional(),
});

export async function publicAdmissionAction(
  _prev: PublicAdmissionState,
  formData: FormData
): Promise<PublicAdmissionState> {
  const parsed = schema.safeParse({
    tenantSlug: formData.get("tenantSlug"),
    applicantName: formData.get("applicantName"),
    phone: formData.get("phone"),
    fatherName: formData.get("fatherName") || undefined,
    applyingClass: formData.get("applyingClass") || undefined,
    previousSchool: formData.get("previousSchool") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }
  const data = parsed.data;

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: data.tenantSlug, status: "ACTIVE" },
      select: { id: true },
    });
    if (!tenant) return { error: "প্রতিষ্ঠান পাওয়া যায়নি" };

    await prisma.admissionLead.create({
      data: {
        tenantId: tenant.id,
        applicantName: data.applicantName,
        phone: data.phone.replace(/\s+/g, ""),
        fatherName: data.fatherName,
        applyingClass: data.applyingClass,
        previousSchool: data.previousSchool,
        source: "WEBSITE",
        status: "NEW",
        notes: data.notes,
      },
    });

    return {
      success: true,
      message: "অফিস থেকে শীঘ্রই যোগাযোগ করা হবে।",
    };
  } catch (e) {
    console.error("publicAdmission", e);
    return { error: "আবেদন জমা হয়নি। আবার চেষ্টা করুন।" };
  }
}
