"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type ChatState = { error?: string; success?: boolean };

export async function postChatMessageAction(
  _prev: ChatState,
  formData: FormData
): Promise<ChatState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };

  const threadKey = String(formData.get("threadKey") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!threadKey || body.length < 1) return { error: "মেসেজ লিখুন" };

  try {
    await prisma.chatMessage.create({
      data: {
        tenantId: session.user.tenantId,
        threadKey,
        senderRole: session.user.role || "STAFF",
        senderName: session.user.name || "User",
        body,
      },
    });
    revalidatePath("/tenant/admin/messaging");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "পাঠানো যায়নি" };
  }
}
