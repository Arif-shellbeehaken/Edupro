"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { compare } from "bcryptjs";
import { signIn, auth } from "@/infrastructure/auth/auth";
import { getDashboardPath } from "@/infrastructure/auth/rbac";
import { prisma } from "@/infrastructure/database/prisma";
import { verifyTotp } from "@/infrastructure/security/totp";
import { rateLimitAsync } from "@/infrastructure/security/rate-limit";

const loginSchema = z.object({
  email: z.string().min(1, "ইমেইল বা মোবাইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export type LoginState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  /** When true, client should collect TOTP and post to verify2faAction */
  requires2FA?: boolean;
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const rl = await rateLimitAsync(`login:${emailNorm}`, 8, 15 * 60 * 1000);
  if (!rl.ok) {
    return {
      error: `অনেকবার চেষ্টা হয়েছে। ${rl.retryAfterSec} সেকেন্ড পর আবার চেষ্টা করুন।`,
    };
  }

  // Pre-check credentials + 2FA flag before Auth.js session
  const user = await prisma.user.findFirst({
    where: { email: emailNorm, deletedAt: null, isActive: true },
    select: {
      id: true,
      passwordHash: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user?.passwordHash) {
    return { error: "ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে" };
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return { error: "ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে" };
  }

  if (user.twoFactorEnabled && user.twoFactorSecret) {
    return {
      requires2FA: true,
      email: emailNorm,
    };
  }

  try {
    await signIn("credentials", {
      email: emailNorm,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে" };
        default:
          return { error: "লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
      }
    }
    throw error;
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "সেশন তৈরি হয়নি। আবার চেষ্টা করুন।" };
  }

  const redirectTo = getDashboardPath(
    session.user.role,
    session.user.isSuperAdmin
  );

  return { success: true, redirectTo };
}

const verifySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(6),
  token: z.string().min(6).max(8),
});

export async function verify2faAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return { error: "৬-ডিজিট কোড দিন", requires2FA: true, email: String(formData.get("email") || "") };
  }

  const { email, password, token } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: { email: emailNorm, deletedAt: null, isActive: true },
    select: {
      passwordHash: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user?.passwordHash || !user.twoFactorSecret || !user.twoFactorEnabled) {
    return { error: "2FA সেশন অবৈধ — আবার লগইন করুন" };
  }

  const validPw = await compare(password, user.passwordHash);
  if (!validPw) {
    return { error: "পাসওয়ার্ড ভুল", requires2FA: true, email: emailNorm };
  }

  if (!verifyTotp(user.twoFactorSecret, token)) {
    return {
      error: "Authenticator কোড সঠিক নয়",
      requires2FA: true,
      email: emailNorm,
    };
  }

  try {
    await signIn("credentials", {
      email: emailNorm,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "লগইন ব্যর্থ", requires2FA: true, email: emailNorm };
    }
    throw error;
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "সেশন তৈরি হয়নি" };
  }

  return {
    success: true,
    redirectTo: getDashboardPath(session.user.role, session.user.isSuperAdmin),
  };
}
