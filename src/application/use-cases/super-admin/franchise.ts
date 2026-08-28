"use server";

import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { revalidatePath } from "next/cache";

export type FranchiseState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/** Log franchise/partner revenue share for a tenant (platform audit via support ticket). */
export async function setFranchiseShareAction(
  _prev: FranchiseState,
  formData: FormData
): Promise<FranchiseState> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return { error: "Super admin only" };

  const slug = String(formData.get("slug") || "").trim();
  const share = Number(formData.get("sharePercent") || 0);
  const partner = String(formData.get("partnerName") || "").trim();
  if (!slug || share < 0 || share > 100) {
    return { error: "slug ও 0–100% শেয়ার দিন" };
  }

  try {
    const t = await prisma.tenant.findFirst({ where: { slug } });
    if (!t) return { error: "Tenant নেই" };

    await prisma.supportTicket.create({
      data: {
        tenantId: t.id,
        subject: `Franchise share ${share}%`,
        description: `Partner: ${partner || "n/a"} · share ${share}% of subscription`,
        status: "OPEN",
        priority: "LOW",
        category: "BILLING",
      },
    });

    revalidatePath("/super-admin/revenue");
    return {
      success: true,
      message: `${t.name}: partner share ${share}% logged`,
    };
  } catch (e) {
    console.error(e);
    return { error: "সংরক্ষণ ব্যর্থ" };
  }
}
