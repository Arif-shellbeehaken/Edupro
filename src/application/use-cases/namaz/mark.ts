"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { namazRepository } from "@/infrastructure/database/repositories/namaz-repository";

export type NamazState = { error?: string; success?: boolean; count?: number };

export async function markNamazAction(
  _prev: NamazState,
  formData: FormData
): Promise<NamazState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const dateStr = formData.get("date") as string;
  if (!dateStr) return { error: "তারিখ দিন" };
  const date = new Date(dateStr);

  const studentIds = formData.getAll("studentId") as string[];
  if (studentIds.length === 0) return { error: "শিক্ষার্থী নেই" };

  try {
    let count = 0;
    for (const studentId of studentIds) {
      await namazRepository.upsertDay({
        tenantId: session.user.tenantId,
        studentId,
        date,
        fajr: (formData.get(`fajr__${studentId}`) as string) || "ABSENT",
        dhuhr: (formData.get(`dhuhr__${studentId}`) as string) || "ABSENT",
        asr: (formData.get(`asr__${studentId}`) as string) || "ABSENT",
        maghrib: (formData.get(`maghrib__${studentId}`) as string) || "ABSENT",
        isha: (formData.get(`isha__${studentId}`) as string) || "ABSENT",
        markedById: session.user.id,
      });
      count++;
    }
    revalidatePath("/tenant/admin/namaz");
    return { success: true, count };
  } catch (e) {
    console.error(e);
    return { error: "নামাজ রেকর্ড সংরক্ষণ ব্যর্থ" };
  }
}
