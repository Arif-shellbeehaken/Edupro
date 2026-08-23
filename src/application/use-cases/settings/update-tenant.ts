"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { prisma } from "@/infrastructure/database/prisma";

export type SettingsState = { error?: string; success?: boolean };

export async function updateTenantSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const name = (formData.get("name") as string)?.trim();
  const nameBn = (formData.get("nameBn") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();

  if (!name) return { error: "প্রতিষ্ঠানের নাম আবশ্যক" };

  try {
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        name,
        ...(nameBn ? { nameBn } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(address ? { address } : {}),
      },
    });
    revalidatePath("/tenant/admin/settings");
    revalidatePath("/tenant/admin/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "সেটিংস আপডেট ব্যর্থ" };
  }
}
