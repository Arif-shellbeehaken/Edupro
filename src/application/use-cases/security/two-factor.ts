"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import {
  generateTotpSecret,
  verifyTotp,
  otpauthUri,
} from "@/infrastructure/security/totp";

export type TwoFactorState = {
  error?: string;
  success?: boolean;
  secret?: string;
  uri?: string;
  message?: string;
};

/** Step 1: generate secret (user must verify before enable) */
export async function setupTwoFactorAction(
  _prev: TwoFactorState,
  _formData: FormData
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "লগইন প্রয়োজন" };

  const secret = generateTotpSecret();
  // Store temporarily as secret but keep twoFactorEnabled=false until verified
  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  const uri = otpauthUri(secret, session.user.email ?? "user@edupro");
  revalidatePath("/tenant/admin/security");
  return {
    success: true,
    secret,
    uri,
    message: "Authenticator অ্যাপে secret যোগ করুন, তারপর কোড ভেরিফাই করুন",
  };
}

/** Step 2: verify code and enable */
export async function enableTwoFactorAction(
  _prev: TwoFactorState,
  formData: FormData
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "লগইন প্রয়োজন" };

  const token = (formData.get("token") as string)?.trim();
  if (!token) return { error: "৬-ডিজিট কোড দিন" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });
  if (!user?.twoFactorSecret) {
    return { error: "আগে Setup চাপুন" };
  }

  if (!verifyTotp(user.twoFactorSecret, token)) {
    return { error: "কোড সঠিক নয় — আবার চেষ্টা করুন" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });
  revalidatePath("/tenant/admin/security");
  return { success: true, message: "2FA সক্রিয় হয়েছে" };
}

export async function disableTwoFactorAction(
  _prev: TwoFactorState,
  formData: FormData
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "লগইন প্রয়োজন" };

  const token = (formData.get("token") as string)?.trim();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (user?.twoFactorEnabled && user.twoFactorSecret) {
    if (!token || !verifyTotp(user.twoFactorSecret, token)) {
      return { error: "বন্ধ করতে বৈধ Authenticator কোড দিন" };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  revalidatePath("/tenant/admin/security");
  return { success: true, message: "2FA বন্ধ হয়েছে" };
}
