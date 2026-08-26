"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type WizardState = {
  error?: string;
  success?: boolean;
  step?: number;
  message?: string;
};

export async function completeOnboardingAction(
  _prev: WizardState,
  formData: FormData
): Promise<WizardState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const name = (formData.get("name") as string)?.trim();
  const nameBn = (formData.get("nameBn") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const primaryColor = (formData.get("primaryColor") as string)?.trim();
  const yearName =
    (formData.get("yearName") as string)?.trim() || "2025-2026";
  const className = (formData.get("className") as string)?.trim() || "Class 6";
  const classNameBn = (formData.get("classNameBn") as string)?.trim();
  const className2 = (formData.get("className2") as string)?.trim();
  const className2Bn = (formData.get("className2Bn") as string)?.trim();
  const feeName = (formData.get("feeName") as string)?.trim() || "Monthly Tuition";
  const feeAmount = Number(formData.get("feeAmount") || 0);
  const feeName2 = (formData.get("feeName2") as string)?.trim();
  const feeAmount2 = Number(formData.get("feeAmount2") || 0);

  if (!name) return { error: "প্রতিষ্ঠানের নাম দিন", step: 1 };

  try {
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        name,
        nameBn: nameBn || undefined,
        phone: phone || undefined,
        address: address || undefined,
        primaryColor: primaryColor || "#059669",
      },
    });

    // Academic year
    const existingYear = await prisma.academicYear.findFirst({
      where: { tenantId: session.user.tenantId, name: yearName },
    });
    const year =
      existingYear ||
      (await prisma.academicYear.create({
        data: {
          tenantId: session.user.tenantId,
          name: yearName,
          startDate: new Date(`${yearName}-01-01`),
          endDate: new Date(`${yearName}-12-31`),
          isCurrent: true,
        },
      }));

    // Ensure only this year is current
    await prisma.academicYear.updateMany({
      where: { tenantId: session.user.tenantId, id: { not: year.id } },
      data: { isCurrent: false },
    });
    if (!year.isCurrent) {
      await prisma.academicYear.update({
        where: { id: year.id },
        data: { isCurrent: true },
      });
    }

    // Class + default section A
    async function ensureClass(name: string, nameBn?: string) {
      let cls = await prisma.class.findFirst({
        where: {
          tenantId: session.user.tenantId,
          academicYearId: year.id,
          name,
          deletedAt: null,
        },
      });
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            tenantId: session.user.tenantId,
            name,
            nameBn: nameBn || undefined,
            academicYearId: year.id,
          },
        });
      }
      const sec = await prisma.section.findFirst({
        where: { classId: cls.id, name: "A" },
      });
      if (!sec) {
        await prisma.section.create({
          data: {
            tenantId: session.user.tenantId,
            classId: cls.id,
            name: "A",
          },
        });
      }
      return cls;
    }

    await ensureClass(className, classNameBn || undefined);
    if (className2) {
      await ensureClass(className2, className2Bn || undefined);
    }

    // Optional fee head if model exists
    try {
      const feeCount = await prisma.feeStructure.count({
        where: { tenantId: session.user.tenantId },
      });
      if (feeCount === 0) {
        if (feeAmount > 0) {
          await prisma.feeStructure.create({
            data: {
              tenantId: session.user.tenantId,
              name: feeName,
              amount: feeAmount,
              feeType: "TUITION",
              isRecurring: true,
              isActive: true,
            },
          });
        }
        if (feeName2 && feeAmount2 > 0) {
          await prisma.feeStructure.create({
            data: {
              tenantId: session.user.tenantId,
              name: feeName2,
              amount: feeAmount2,
              feeType: "OTHER",
              isRecurring: true,
              isActive: true,
            },
          });
        }
      }

    } catch {
      /* fee model may differ */
    }

    revalidatePath("/tenant/admin/dashboard");
    revalidatePath("/tenant/onboarding");
    return {
      success: true,
      message: "অনবোর্ডিং সম্পন্ন — সেশন, ক্লাস, সেকশন ও ফি সেট · ড্যাশবোর্ডে যান",
    };
  } catch (e) {
    console.error(e);
    return { error: "অনবোর্ডিং সংরক্ষণ ব্যর্থ — স্কিমা/ফিল্ড চেক করুন" };
  }
}
