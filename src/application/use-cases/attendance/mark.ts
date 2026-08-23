"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";

const schema = z.object({
  date: z.string().min(1),
  // form fields: status__{studentId} = PRESENT|ABSENT|...
});

export type MarkAttendanceState = {
  error?: string;
  success?: boolean;
  count?: number;
};

export async function markAttendanceAction(
  _prev: MarkAttendanceState,
  formData: FormData
): Promise<MarkAttendanceState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) {
    return { error: "অনুমতি নেই" };
  }

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const dateStr = formData.get("date") as string;
  if (!dateStr) return { error: "তারিখ দিন" };

  const date = new Date(dateStr);
  const entries: {
    tenantId: string;
    studentId: string;
    date: Date;
    status: string;
    markedById: string;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("status__") && typeof value === "string" && value) {
      const studentId = key.replace("status__", "");
      entries.push({
        tenantId: session.user.tenantId,
        studentId,
        date,
        status: value,
        markedById: session.user.id,
      });
    }
  }

  if (entries.length === 0) {
    return { error: "কোনো উপস্থিতি সিলেক্ট করা হয়নি" };
  }

  try {
    await attendanceRepository.markMany(entries);
    revalidatePath("/tenant/admin/attendance");
    return { success: true, count: entries.length };
  } catch (e) {
    console.error(e);
    return { error: "উপস্থিতি সংরক্ষণ করা যায়নি" };
  }
}
