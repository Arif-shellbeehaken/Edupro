"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type HijriState = { error?: string; success?: boolean; message?: string };

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

  const announce = formData.get("announce") === "on";
  const titleBn = (formData.get("titleBn") as string) || undefined;
  const gregorianDate = formData.get("gregorianDate")
    ? new Date(formData.get("gregorianDate") as string)
    : undefined;
  const notes = (formData.get("notes") as string) || undefined;

  try {
    const holiday = await prisma.hijriHoliday.create({
      data: {
        tenantId: session.user.tenantId,
        title,
        titleBn,
        hijriDate,
        gregorianDate,
        holidayType: (formData.get("holidayType") as string) || "RELIGIOUS",
        notes,
        isRecurring: formData.get("isRecurring") === "on",
      },
    });

    let smsNote = "";
    if (announce) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const phones = new Set<string>();
        const students = await prisma.student.findMany({
          where: {
            tenantId: session.user.tenantId,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: { fatherPhone: true, guardianPhone: true },
          take: 400,
        });
        for (const st of students) {
          const ph = st.guardianPhone || st.fatherPhone;
          if (ph) phones.add(ph);
        }
        const staff = await prisma.staff.findMany({
          where: {
            tenantId: session.user.tenantId,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: { phone: true },
          take: 100,
        });
        for (const s of staff) {
          if (s.phone) phones.add(s.phone);
        }
        const label = titleBn || title;
        const g =
          gregorianDate ? ` (${gregorianDate.toLocaleDateString("en-GB")})` : "";
        const body = `হিজরি ছুটি ঘোষণা: ${label} — ${hijriDate}${g}${notes ? ". " + notes.slice(0, 50) : ""}। — Edupro`;
        let sent = 0;
        for (const phone of phones) {
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: label,
              body,
              relatedType: "HIJRI_HOLIDAY",
              relatedId: holiday.id,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
        smsNote = ` · SMS ${sent}`;
      } catch (smsErr) {
        console.error("hijri SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/hijri");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `ছুটি যোগ${smsNote}` };
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
