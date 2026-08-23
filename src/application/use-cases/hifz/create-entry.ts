"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hifzRepository } from "@/infrastructure/database/repositories/hifz-repository";
import { HifzStream, TilawatQuality } from "@/domain/enums";

const schema = z.object({
  studentId: z.string().min(1),
  stream: z.enum(["SABAK", "SABKI", "MANZIL"]),
  fromJuz: z.coerce.number().int().min(1).max(30),
  fromPage: z.coerce.number().int().min(1).max(604),
  toJuz: z.coerce.number().int().min(1).max(30),
  toPage: z.coerce.number().int().min(1).max(604),
  fromSurah: z.string().optional(),
  toSurah: z.string().optional(),
  quality: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_WORK", "WEAK"]),
  mistakesCount: z.coerce.number().int().min(0).optional(),
  teacherNote: z.string().max(500).optional(),
  date: z.string().optional(),
});

export type CreateHifzEntryState = {
  error?: string;
  success?: boolean;
};

export async function createHifzEntryAction(
  _prev: CreateHifzEntryState,
  formData: FormData
): Promise<CreateHifzEntryState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) {
    return { error: "অনুমতি নেই। আবার লগইন করুন।" };
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const raw = {
    studentId: formData.get("studentId"),
    stream: formData.get("stream"),
    fromJuz: formData.get("fromJuz"),
    fromPage: formData.get("fromPage"),
    toJuz: formData.get("toJuz"),
    toPage: formData.get("toPage"),
    fromSurah: formData.get("fromSurah") || undefined,
    toSurah: formData.get("toSurah") || undefined,
    quality: formData.get("quality"),
    mistakesCount: formData.get("mistakesCount") || undefined,
    teacherNote: formData.get("teacherNote") || undefined,
    date: formData.get("date") || undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "ইনপুট সঠিক নয়" };
  }

  const data = parsed.data;

  try {
    await hifzRepository.createEntry({
      tenantId: session.user.tenantId,
      studentId: data.studentId,
      teacherId: session.user.id,
      date: data.date ? new Date(data.date) : new Date(),
      stream: data.stream as HifzStream,
      fromJuz: data.fromJuz,
      fromPage: data.fromPage,
      toJuz: data.toJuz,
      toPage: data.toPage,
      fromSurah: data.fromSurah,
      toSurah: data.toSurah,
      quality: data.quality as TilawatQuality,
      mistakesCount: data.mistakesCount,
      teacherNote: data.teacherNote,
    });

    revalidatePath("/tenant/admin/hifz");
    revalidatePath(`/tenant/admin/hifz/${data.studentId}`);
    return { success: true };
  } catch (e) {
    console.error("createHifzEntry", e);
    return { error: "এন্ট্রি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
