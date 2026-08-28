"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/infrastructure/database/prisma";
import { rateLimitAsync } from "@/infrastructure/security/rate-limit";

export type ParentOtpState = {
  error?: string;
  success?: boolean;
  message?: string;
  step?: "phone" | "otp";
};

function genOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Step 1: send OTP to guardian phone linked to students */
export async function requestParentOtpAction(
  _prev: ParentOtpState,
  formData: FormData
): Promise<ParentOtpState> {
  const phone = String(formData.get("phone") || "")
    .replace(/\s+/g, "")
    .trim();
  const tenantSlug = String(formData.get("tenantSlug") || "").trim();

  if (!phone || phone.length < 10) {
    return { error: "সঠিক মোবাইল নম্বর দিন", step: "phone" };
  }

  const rl = await rateLimitAsync(`otp:${phone}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return {
      error: `OTP অনুরোধ সীমা পেরিয়েছে। ${rl.retryAfterSec} সেকেন্ড পর চেষ্টা করুন।`,
      step: "phone",
    };
  }

  try {
    // Resolve tenant: slug or first student match
    let tenantId: string | null = null;
    if (tenantSlug) {
      const t = await prisma.tenant.findFirst({
        where: { slug: tenantSlug },
        select: { id: true },
      });
      tenantId = t?.id ?? null;
    }

    const studentWhere: {
      deletedAt: null;
      status: string;
      tenantId?: string;
      OR: { guardianPhone?: string; fatherPhone?: string }[];
    } = {
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ guardianPhone: phone }, { fatherPhone: phone }],
    };
    if (tenantId) studentWhere.tenantId = tenantId;

    const linkedStudents = await prisma.student.findMany({
      where: studentWhere,
      select: { tenantId: true, name: true, nameBn: true, studentId: true },
      take: 5,
    });

    if (linkedStudents.length === 0) {
      return {
        error: "এই নম্বরে কোনো শিক্ষার্থী লিংক নেই",
        step: "phone",
      };
    }

    const linked = linkedStudents[0]!;
    const names = linkedStudents
      .map((s) => s.nameBn || s.name)
      .join(", ");

    const otp = genOtp();
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    await communicationRepository.sendMessage({
      tenantId: linked.tenantId,
      channel: "SMS",
      recipient: phone,
      subject: "PARENT_OTP",
      body: `Edupro অভিভাবক OTP: ${otp} (${names})। ১০ মিনিটের মধ্যে ব্যবহার করুন। শেয়ার করবেন না।`,
      relatedType: "PARENT_OTP",
      relatedId: phone,
    });

    // Store challenge in cookie (hashed-ish: phone + otp + tenant, short lived)
    const jar = await cookies();
    const payload = Buffer.from(
      JSON.stringify({
        phone,
        otp,
        tenantId: linked.tenantId,
        exp: Date.now() + 10 * 60 * 1000,
      })
    ).toString("base64url");
    jar.set("edupro_parent_otp", payload, {
      path: "/",
      maxAge: 600,
      httpOnly: true,
      sameSite: "lax",
    });

    return {
      success: true,
      step: "otp",
      message: "OTP পাঠানো হয়েছে — কোড লিখুন",
    };
  } catch (e) {
    console.error(e);
    return { error: "OTP পাঠানো যায়নি", step: "phone" };
  }
}

/** Step 2: verify OTP and set parent session cookie */
export async function verifyParentOtpAction(
  _prev: ParentOtpState,
  formData: FormData
): Promise<ParentOtpState> {
  const token = String(formData.get("otp") || "").trim();
  if (!/^\d{6}$/.test(token)) {
    return { error: "৬-ডিজিট OTP দিন", step: "otp" };
  }

  try {
    const jar = await cookies();
    const raw = jar.get("edupro_parent_otp")?.value;
    if (!raw) {
      return { error: "OTP মেয়াদ শেষ — আবার রিকোয়েস্ট করুন", step: "phone" };
    }

    const data = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as { phone: string; otp: string; tenantId: string; exp: number };

    if (Date.now() > data.exp) {
      jar.delete("edupro_parent_otp");
      return { error: "OTP মেয়াদ শেষ", step: "phone" };
    }
    if (data.otp !== token) {
      return { error: "OTP সঠিক নয়", step: "otp" };
    }

    // Parent verified session cookie
    const sessionPayload = Buffer.from(
      JSON.stringify({
        phone: data.phone,
        tenantId: data.tenantId,
        role: "PARENT",
        exp: Date.now() + 12 * 60 * 60 * 1000,
      })
    ).toString("base64url");
    jar.set("edupro_parent_session", sessionPayload, {
      path: "/",
      maxAge: 60 * 60 * 12,
      httpOnly: true,
      sameSite: "lax",
    });
    jar.delete("edupro_parent_otp");

    revalidatePath("/parent");
    return {
      success: true,
      message: "লগইন সফল — পোর্টালে যান",
      step: "otp",
    };
  } catch (e) {
    console.error(e);
    return { error: "ভেরিফিকেশন ব্যর্থ", step: "otp" };
  }
}
