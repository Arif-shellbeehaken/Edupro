"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type SubState = { error?: string; success?: boolean; message?: string };

export async function updateTenantPlanAction(
  _prev: SubState,
  formData: FormData
): Promise<SubState> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return { error: "শুধু Super Admin" };
  }

  const tenantId = formData.get("tenantId") as string;
  const plan = formData.get("plan") as string;
  const status = formData.get("status") as string;

  if (!tenantId || !plan) return { error: "ইনপুট অসম্পূর্ণ" };

  const planConfig = await prisma.subscriptionPlanConfig.findUnique({
    where: { code: plan },
  });

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        ...(status ? { status } : {}),
        ...(planConfig
          ? {
              maxStudents: planConfig.maxStudents,
              maxStaff: planConfig.maxStaff,
            }
          : {}),
      },
    });
    revalidatePath("/super-admin/subscriptions");
    revalidatePath("/super-admin/tenants");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "প্ল্যান আপডেট ব্যর্থ" };
  }
}

export async function ensurePlanConfigsAction(): Promise<SubState> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return { error: "শুধু Super Admin" };

  const plans = [
    {
      code: "BASIC",
      name: "Basic",
      nameBn: "বেসিক",
      priceMonthly: 1500,
      priceYearly: 15000,
      maxStudents: 300,
      maxStaff: 20,
      features: { hifz: true, sms: false },
      sortOrder: 1,
    },
    {
      code: "STANDARD",
      name: "Standard",
      nameBn: "স্ট্যান্ডার্ড",
      priceMonthly: 3500,
      priceYearly: 35000,
      maxStudents: 1000,
      maxStaff: 50,
      features: { hifz: true, sms: true },
      sortOrder: 2,
    },
    {
      code: "PREMIUM",
      name: "Premium",
      nameBn: "প্রিমিয়াম",
      priceMonthly: 7500,
      priceYearly: 75000,
      maxStudents: 3000,
      maxStaff: 150,
      features: { hifz: true, sms: true, hostel: true },
      sortOrder: 3,
    },
    {
      code: "ENTERPRISE",
      name: "Enterprise",
      nameBn: "এন্টারপ্রাইজ",
      priceMonthly: 15000,
      priceYearly: 150000,
      maxStudents: 10000,
      maxStaff: 500,
      features: { hifz: true, sms: true, hostel: true, multiCampus: true },
      sortOrder: 4,
    },
  ];

  for (const p of plans) {
    await prisma.subscriptionPlanConfig.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        nameBn: p.nameBn,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxStudents: p.maxStudents,
        maxStaff: p.maxStaff,
        features: p.features,
        sortOrder: p.sortOrder,
        isActive: true,
      },
      create: {
        code: p.code,
        name: p.name,
        nameBn: p.nameBn,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxStudents: p.maxStudents,
        maxStaff: p.maxStaff,
        features: p.features,
        sortOrder: p.sortOrder,
        isActive: true,
      },
    });
  }

  revalidatePath("/super-admin/subscriptions");
  return { success: true };
}


/** SMS tenants whose trial/subscription ends within N days */
export async function notifyExpiringSubscriptionsAction(
  _prev: SubState,
  formData: FormData
): Promise<SubState> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return { error: "শুধু Super Admin" };
  }

  const days = Math.min(30, Math.max(1, Number(formData.get("days") || 7)));

  try {
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + days);

    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { subscriptionEndsAt: { gte: now, lte: until } },
          { trialEndsAt: { gte: now, lte: until } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        phone: true,
        plan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      },
      take: 100,
    });

    if (tenants.length === 0) {
      return { error: `আগামী ${days} দিনে মেয়াদোত্তীর্ণ কোনো সাবস্ক্রিপশন নেই` };
    }

    let sent = 0;
    for (const t of tenants) {
      if (!t.phone) continue;
      const end =
        t.subscriptionEndsAt || t.trialEndsAt
          ? (t.subscriptionEndsAt || t.trialEndsAt)!.toLocaleDateString("en-GB")
          : "শীঘ্রই";
      const body = `সাবস্ক্রিপশন রিমাইন্ডার: ${t.nameBn || t.name} (${t.plan}) — মেয়াদ শেষ ${end}। রিনিউ করুন। — Edupro`;
      try {
        await communicationRepository.sendMessage({
          tenantId: t.id,
          channel: "SMS",
          recipient: t.phone,
          subject: "Subscription expiry",
          body,
          relatedType: "SUBSCRIPTION",
          relatedId: t.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/super-admin/subscriptions");
    return {
      success: true,
      message: `${tenants.length} টেনান্ট · SMS ${sent}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "এক্সপায়ারি রিমাইন্ডার ব্যর্থ" };
  }
}
