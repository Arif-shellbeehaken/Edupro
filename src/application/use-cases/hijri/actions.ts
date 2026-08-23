"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type HijriState = { error?: string; success?: boolean };

export async function createHijriHolidayAction(
  _prev: HijriState,
  formData: FormData
): Promise<HijriState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const title = (formData.get("title") as string)?.trim();
  const hijriDate = (formData.get("hijriDate") as string)?.trim();
  if (!title || !hijriDate) return { error: "শিরোনাম ও হিজরি তারিখ দিন" };

  try {
    await prisma.hijriHoliday.create({
      data: {
        tenantId: session.user.tenantId,
        title,
        titleBn: (formData.get("titleBn") as string) || undefined,
        hijriDate,
        gregorianDate: formData.get("gregorianDate")
          ? new Date(formData.get("gregorianDate") as string)
          : undefined,
        holidayType: (formData.get("holidayType") as string) || "RELIGIOUS",
        notes: (formData.get("notes") as string) || undefined,
        isRecurring: formData.get("isRecurring") === "on",
      },
    });
    revalidatePath("/tenant/admin/hijri");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "ছুটি যোগ করা যায়নি" };
  }
}

/** Seed common Islamic observances for the tenant (idempotent by title) */
export async function seedDefaultHijriHolidaysAction(
  _prev: HijriState,
  _formData: FormData
): Promise<HijriState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const defaults = [
    { title: "Islamic New Year", titleBn: "হিজরি নববর্ষ", hijriDate: "1 Muharram" },
    { title: "Ashura", titleBn: "আশুরা", hijriDate: "10 Muharram" },
    { title: "Mawlid an-Nabi", titleBn: "ঈদে মিলাদুন্নবী", hijriDate: "12 Rabi' al-Awwal" },
    { title: "Start of Ramadan", titleBn: "রমজান শুরু", hijriDate: "1 Ramadan" },
    { title: "Laylat al-Qadr", titleBn: "লাইলাতুল কদর", hijriDate: "27 Ramadan" },
    { title: "Eid al-Fitr", titleBn: "ঈদুল ফিতর", hijriDate: "1 Shawwal" },
    { title: "Day of Arafah", titleBn: "আরাফার দিন", hijriDate: "9 Dhu al-Hijjah" },
    { title: "Eid al-Adha", titleBn: "ঈদুল আজহা", hijriDate: "10 Dhu al-Hijjah" },
  ];

  try {
    for (const h of defaults) {
      const exists = await prisma.hijriHoliday.findFirst({
        where: { tenantId: session.user.tenantId, title: h.title },
      });
      if (!exists) {
        await prisma.hijriHoliday.create({
          data: {
            tenantId: session.user.tenantId,
            title: h.title,
            titleBn: h.titleBn,
            hijriDate: h.hijriDate,
            holidayType: "RELIGIOUS",
            isRecurring: true,
          },
        });
      }
    }
    revalidatePath("/tenant/admin/hijri");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "ডিফল্ট ছুটি সিড ব্যর্থ" };
  }
}
