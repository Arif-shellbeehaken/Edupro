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
    const ticket = await prisma.supportTicket.create({
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

    // Notify platform super-admins with phone
    try {
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const supers = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN", isActive: true },
        select: { phone: true },
        take: 10,
      });
      const phones = new Set<string>();
      for (const u of supers) {
        if (u.phone) phones.add(u.phone);
      }
      if (session.user.tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId },
          select: { phone: true, name: true },
        });
        // also no tenant self-notify on create
      }
      const body = `নতুন সাপোর্ট টিকিট: "${subject}" (${(formData.get("priority") as string) || "MEDIUM"})। — Edupro`;
      for (const phone of phones) {
        try {
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId || "platform",
            channel: "SMS",
            recipient: phone,
            subject,
            body,
            relatedType: "SUPPORT_ASSIGN",
            relatedId: ticket.id,
          });
        } catch {
          /* continue */
        }
      }
    } catch (e) {
      console.error("ticket create SMS", e);
    }

    revalidatePath("/super-admin/support");
    revalidatePath("/tenant/admin/settings");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: "টিকিট জমা হয়েছে · সাপোর্ট নোটিফাইড" };
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

  const assigneeNote = (formData.get("assigneeNote") as string) || undefined;

  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return { error: "টিকিট পাওয়া যায়নি" };

    const assigneePhone = String(formData.get("assigneePhone") || "").trim() || undefined;

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        assigneeNote,
        ...(status === "RESOLVED" || status === "CLOSED"
          ? { resolvedAt: new Date() }
          : {}),
      },
    });

    if (assigneePhone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        await communicationRepository.sendMessage({
          tenantId: ticket.tenantId || "platform",
          channel: "SMS",
          recipient: assigneePhone,
          subject: ticket.subject,
          body: `টিকিট অ্যাসাইন: "${ticket.subject}" — স্ট্যাটাস ${status}${assigneeNote ? ". " + assigneeNote : ""}। — Edupro`,
          relatedType: "SUPPORT_ASSIGN",
          relatedId: ticket.id,
        });
      } catch (e) {
        console.error("assignee SMS", e);
      }
    }

    let smsNote = "";
    if (ticket.createdById) {
      const creator = await prisma.user.findUnique({
        where: { id: ticket.createdById },
        select: { phone: true, name: true },
      });
      if (creator?.phone) {
        try {
          const { communicationRepository } = await import(
            "@/infrastructure/database/repositories/communication-repository"
          );
          const STATUS_BN: Record<string, string> = {
            OPEN: "খোলা",
            IN_PROGRESS: "চলমান",
            WAITING: "অপেক্ষমাণ",
            RESOLVED: "সমাধান",
            CLOSED: "বন্ধ",
          };
          const body = `সাপোর্ট টিকিট: "${ticket.subject}" — স্ট্যাটাস: ${STATUS_BN[status] || status}.${assigneeNote ? " নোট: " + assigneeNote : ""} — Edupro`;
          await communicationRepository.sendMessage({
            tenantId: ticket.tenantId || session.user.tenantId || "platform",
            channel: "SMS",
            recipient: creator.phone,
            subject: `Ticket ${status}`,
            body,
            relatedType: "SUPPORT",
            relatedId: ticket.id,
          });
          smsNote = " · SMS";
        } catch (smsErr) {
          console.error("support SMS", smsErr);
        }
      }
    }

    revalidatePath("/super-admin/support");
    revalidatePath("/tenant/admin/settings");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `টিকিট আপডেট${smsNote}` };
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
  const notify = formData.get("notify") === "on";

  try {
    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        ...(primaryColor ? { primaryColor } : {}),
        ...(secondaryColor ? { secondaryColor } : { secondaryColor: null }),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      },
    });

    let smsNote = "";
    if (notify) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const phones = new Set<string>();
        if (tenant.phone) phones.add(tenant.phone);
        const staff = await prisma.staff.findMany({
          where: {
            tenantId: session.user.tenantId,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: { phone: true },
          take: 50,
        });
        for (const s of staff) {
          if (s.phone) phones.add(s.phone);
        }
        const body = `White-label থিম আপডেট: ${tenant.nameBn || tenant.name} — প্রাইমারি ${primaryColor || tenant.primaryColor || "#059669"}। নতুন ব্র্যান্ডিং লাইভ। — Edupro`;
        let sent = 0;
        for (const phone of phones) {
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Theme publish",
              body,
              relatedType: "WHITELABEL",
              relatedId: session.user.tenantId,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
        smsNote = ` · SMS ${sent}`;
      } catch (e) {
        console.error("branding SMS", e);
      }
    }

    revalidatePath("/tenant/admin/settings");
    revalidatePath("/tenant/admin/dashboard");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `ব্র্যান্ডিং সেভ হয়েছে${smsNote}` };
  } catch (e) {
    console.error(e);
    return { error: "ব্র্যান্ডিং আপডেট ব্যর্থ" };
  }
}
