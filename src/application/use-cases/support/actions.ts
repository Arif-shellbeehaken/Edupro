"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type TicketState = { error?: string; success?: boolean; message?: string };

export async function createSupportTicketAction(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  const session = await auth();
  if (!session?.user) return { error: "লগইন প্রয়োজন" };

  const subject = (formData.get("subject") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!subject || !description) return { error: "বিষয় ও বিবরণ দিন" };

  try {
    await prisma.supportTicket.create({
      data: {
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        subject,
        description,
        category: (formData.get("category") as string) || "GENERAL",
        priority: (formData.get("priority") as string) || "MEDIUM",
        status: "OPEN",
      },
    });
    revalidatePath("/super-admin/support");
    revalidatePath("/tenant/admin/settings");
    return { success: true, message: "টিকিট জমা হয়েছে" };
  } catch (e) {
    console.error(e);
    return { error: "টিকিট তৈরি ব্যর্থ" };
  }
}

export async function updateSupportTicketAction(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return { error: "শুধু Super Admin" };

  const id = formData.get("ticketId") as string;
  const status = formData.get("status") as string;
  if (!id || !status) return { error: "ইনপুট অসম্পূর্ণ" };

  try {
    await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        assigneeNote: (formData.get("assigneeNote") as string) || undefined,
        ...(status === "RESOLVED" || status === "CLOSED"
          ? { resolvedAt: new Date() }
          : {}),
      },
    });
    revalidatePath("/super-admin/support");
    return { success: true, message: "টিকিট আপডেট হয়েছে" };
  } catch (e) {
    console.error(e);
    return { error: "আপডেট ব্যর্থ" };
  }
}

export async function updateBrandingAction(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "অনুমতি নেই" };

  const primaryColor = (formData.get("primaryColor") as string)?.trim();
  const secondaryColor = (formData.get("secondaryColor") as string)?.trim();
  const logoUrl = (formData.get("logoUrl") as string)?.trim();

  try {
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        ...(primaryColor ? { primaryColor } : {}),
        ...(secondaryColor ? { secondaryColor } : { secondaryColor: null }),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      },
    });
    revalidatePath("/tenant/admin/settings");
    revalidatePath("/tenant/admin/dashboard");
    return { success: true, message: "ব্র্যান্ডিং সেভ হয়েছে" };
  } catch (e) {
    console.error(e);
    return { error: "ব্র্যান্ডিং আপডেট ব্যর্থ" };
  }
}
