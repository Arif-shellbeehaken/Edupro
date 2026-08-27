"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ParentSession = {
  phone: string;
  tenantId: string;
  role: "PARENT";
  exp: number;
};

export async function getParentSession(): Promise<ParentSession | null> {
  try {
    const jar = await cookies();
    const raw = jar.get("edupro_parent_session")?.value;
    if (!raw) return null;
    const data = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as ParentSession;
    if (!data.phone || !data.tenantId || Date.now() > data.exp) {
      jar.delete("edupro_parent_session");
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function requireParentSession(): Promise<ParentSession> {
  const s = await getParentSession();
  if (!s) redirect("/parent/login");
  return s;
}

export async function parentLogoutAction() {
  const jar = await cookies();
  jar.delete("edupro_parent_session");
  jar.delete("edupro_parent_otp");
  revalidatePath("/parent");
  redirect("/parent/login");
}
