"use server";

import { signOut } from "@/infrastructure/auth/auth";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
