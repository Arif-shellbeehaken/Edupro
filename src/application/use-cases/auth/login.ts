"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/infrastructure/auth/auth";
import { getDashboardPath } from "@/infrastructure/auth/rbac";
import { auth } from "@/infrastructure/auth/auth";

const loginSchema = z.object({
  email: z.string().min(1, "ইমেইল বা মোবাইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export type LoginState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
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

  try {
    await signIn("credentials", {
      email,
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
    // NextAuth may throw redirect errors; rethrow others
    throw error;
  }

  // Fetch session to decide redirect
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
