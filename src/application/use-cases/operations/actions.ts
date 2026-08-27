"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { operationsRepository } from "@/infrastructure/database/repositories/operations-repository";

async function tenantSession() {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return null;
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });
  return session;
}

export type OpsState = { error?: string; success?: boolean; message?: string };

// ─── Library ─────────────────────────────────────────────────
export async function createBookAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const title = formData.get("title") as string;
  if (!title?.trim()) return { error: "বইয়ের নাম দিন" };

  try {
    await operationsRepository.createBook({
      tenantId: session.user.tenantId,
      title: title.trim(),
      titleBn: (formData.get("titleBn") as string) || undefined,
      author: (formData.get("author") as string) || undefined,
      isbn: (formData.get("isbn") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      totalCopies: Number(formData.get("totalCopies") || 1),
      shelfLocation: (formData.get("shelfLocation") as string) || undefined,
    });
    revalidatePath("/tenant/admin/library");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "বই যোগ করা যায়নি" };
  }
}

export async function issueBookAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const bookId = formData.get("bookId") as string;
  const studentId = (formData.get("studentId") as string) || undefined;
  if (!bookId) return { error: "বই সিলেক্ট করুন" };

  const days = Number(formData.get("days") || 14);
  const notify = formData.get("notify") !== "off";

  try {
    const issue = await operationsRepository.issueBook({
      tenantId: session.user.tenantId,
      bookId,
      studentId,
      days,
    });

    let smsNote = "";
    if (notify && studentId) {
      try {
        const { prisma } = await import("@/infrastructure/database/prisma");
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const [student, book] = await Promise.all([
          prisma.student.findFirst({
            where: { id: studentId, tenantId: session.user.tenantId },
            select: {
              name: true,
              nameBn: true,
              studentId: true,
              fatherPhone: true,
              guardianPhone: true,
            },
          }),
          prisma.book.findFirst({
            where: { id: bookId },
            select: { title: true, titleBn: true },
          }),
        ]);
        const phone = student?.guardianPhone || student?.fatherPhone;
        if (phone && student && book) {
          const due = new Date();
          due.setDate(due.getDate() + days);
          const body = `লাইব্রেরি ইস্যু: ${student.nameBn || student.name} (${student.studentId}) — "${book.titleBn || book.title}", ডিউ ${due.toLocaleDateString("en-GB")}। সময়মতো ফেরত দিন। — Edupro`;
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Book issued",
            body,
            relatedType: "LIBRARY_ISSUE",
            relatedId:
              typeof issue === "object" && issue && "id" in issue
                ? String((issue as { id: string }).id)
                : undefined,
          });
          smsNote = " · SMS";
        }
      } catch (smsErr) {
        console.error("library issue SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/library");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `বই ইস্যু হয়েছে${smsNote}` };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "ইস্যু ব্যর্থ" };
  }
}

export async function returnBookAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const issueId = formData.get("issueId") as string;
  if (!issueId) return { error: "ইস্যু আইডি দরকার" };

  try {
    const result = await operationsRepository.returnBook({
      issueId,
      tenantId: session.user.tenantId,
    });
    revalidatePath("/tenant/admin/library");
    return {
      success: true,
      message:
        result.fineAmount > 0
          ? `রিটার্ন OK · জরিমানা ৳${result.fineAmount}`
          : "রিটার্ন সফল",
    };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "রিটার্ন ব্যর্থ" };
  }
}

// ─── Hostel ──────────────────────────────────────────────────
export async function createRoomAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const roomNumber = formData.get("roomNumber") as string;
  if (!roomNumber?.trim()) return { error: "রুম নম্বর দিন" };

  try {
    await operationsRepository.createRoom({
      tenantId: session.user.tenantId,
      roomNumber: roomNumber.trim(),
      blockName: (formData.get("blockName") as string) || undefined,
      capacity: Number(formData.get("capacity") || 4),
      roomType: (formData.get("roomType") as string) || "SHARED",
      monthlyFee: Number(formData.get("monthlyFee") || 0),
    });
    revalidatePath("/tenant/admin/hostel");
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { error: "রুম নম্বর ইতিমধ্যে আছে" };
    }
    return { error: "রুম যোগ করা যায়নি" };
  }
}

export async function allocateRoomAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const roomId = formData.get("roomId") as string;
  const studentId = formData.get("studentId") as string;
  if (!roomId || !studentId) return { error: "রুম ও শিক্ষার্থী সিলেক্ট করুন" };

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const room = await prisma.hostelRoom.findFirst({
      where: { id: roomId, tenantId: session.user.tenantId },
    });
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId: session.user.tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
      },
    });

    const alloc = await operationsRepository.allocateRoom({
      tenantId: session.user.tenantId,
      roomId,
      studentId,
      notes: (formData.get("notes") as string) || undefined,
    });

    let smsNote = "";
    const phone = student?.guardianPhone || student?.fatherPhone;
    if (phone && room && student) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const roomLabel = room.blockName
          ? `${room.blockName}-${room.roomNumber}`
          : room.roomNumber;
        const body = `হোস্টেল অ্যালোকেশন: ${student.nameBn || student.name} (${student.studentId}) — রুম ${roomLabel} (${room.roomType})। মাসিক ফি ৳${room.monthlyFee.toLocaleString("en-BD")}। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Hostel allocation",
          body,
          relatedType: "HOSTEL",
          relatedId: alloc.id,
        });
        smsNote = " · অভিভাবক SMS পাঠানো হয়েছে";
      } catch (smsErr) {
        console.error("hostel SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/hostel");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `রুম অ্যালোকেট হয়েছে${smsNote}`,
    };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "অ্যালোকেশন ব্যর্থ" };
  }
}

// ─── Transport ───────────────────────────────────────────────
export async function createRouteAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "রুটের নাম দিন" };

  try {
    await operationsRepository.createRoute({
      tenantId: session.user.tenantId,
      name: name.trim(),
      nameBn: (formData.get("nameBn") as string) || undefined,
      vehicleNo: (formData.get("vehicleNo") as string) || undefined,
      driverName: (formData.get("driverName") as string) || undefined,
      driverPhone: (formData.get("driverPhone") as string) || undefined,
      monthlyFee: Number(formData.get("monthlyFee") || 0),
      capacity: Number(formData.get("capacity") || 30),
    });
    revalidatePath("/tenant/admin/transport");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "রুট যোগ করা যায়নি" };
  }
}


/** Update route details and SMS assigned guardians + driver */
export async function updateRouteAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const routeId = String(formData.get("routeId") || "");
  if (!routeId) return { error: "রুট বাছুন" };

  const name = String(formData.get("name") || "").trim() || undefined;
  const vehicleNo = String(formData.get("vehicleNo") || "") || undefined;
  const driverName = String(formData.get("driverName") || "") || undefined;
  const driverPhone = String(formData.get("driverPhone") || "") || undefined;
  const monthlyFeeRaw = formData.get("monthlyFee");
  const monthlyFee =
    monthlyFeeRaw !== null && monthlyFeeRaw !== ""
      ? Number(monthlyFeeRaw)
      : undefined;
  const notify = formData.get("notify") !== "off";

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const route = await prisma.transportRoute.findFirst({
      where: { id: routeId, tenantId: session.user.tenantId },
      include: { assignments: { select: { studentId: true } } },
    });
    if (!route) return { error: "রুট পাওয়া যায়নি" };

    const updated = await prisma.transportRoute.update({
      where: { id: routeId },
      data: {
        ...(name ? { name } : {}),
        ...(formData.get("nameBn")
          ? { nameBn: String(formData.get("nameBn")) }
          : {}),
        ...(vehicleNo !== undefined ? { vehicleNo } : {}),
        ...(driverName !== undefined ? { driverName } : {}),
        ...(driverPhone !== undefined ? { driverPhone } : {}),
        ...(monthlyFee !== undefined && !Number.isNaN(monthlyFee)
          ? { monthlyFee }
          : {}),
      },
    });

    let smsNote = "";
    if (notify) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const studentIds = route.assignments
          .map((a) => a.studentId)
          .filter(Boolean);
        const students = studentIds.length
          ? await prisma.student.findMany({
              where: { id: { in: studentIds }, tenantId: session.user.tenantId },
              select: { fatherPhone: true, guardianPhone: true },
            })
          : [];
        const phones = new Set<string>();
        for (const st of students) {
          const ph = st.guardianPhone || st.fatherPhone;
          if (ph) phones.add(ph);
        }
        const dPhone = driverPhone || updated.driverPhone;
        if (dPhone) phones.add(dPhone);

        const label = updated.nameBn || updated.name;
        const body = `ট্রান্সপোর্ট রুট আপডেট: ${label}${updated.vehicleNo ? " · গাড়ি " + updated.vehicleNo : ""}${updated.driverName ? " · ড্রাইভার " + updated.driverName : ""}${updated.monthlyFee ? " · ফি ৳" + updated.monthlyFee : ""}। — Edupro`;
        let sent = 0;
        for (const phone of phones) {
          try {
            await communicationRepository.sendMessage({
              tenantId: session.user.tenantId,
              channel: "SMS",
              recipient: phone,
              subject: "Transport route update",
              body,
              relatedType: "TRANSPORT_ROUTE",
              relatedId: routeId,
            });
            sent += 1;
          } catch {
            /* continue */
          }
        }
        smsNote = ` · SMS ${sent}`;
      } catch (smsErr) {
        console.error("route update SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/transport");
    revalidatePath("/tenant/admin/communication");
    return { success: true, message: `রুট আপডেট${smsNote}` };
  } catch (e) {
    console.error(e);
    return { error: "রুট আপডেট ব্যর্থ" };
  }
}

export async function assignTransportAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const routeId = formData.get("routeId") as string;
  const studentId = formData.get("studentId") as string;
  const pickupPoint = (formData.get("pickupPoint") as string) || undefined;
  if (!routeId || !studentId) return { error: "রুট ও শিক্ষার্থী সিলেক্ট করুন" };

  try {
    const { prisma } = await import("@/infrastructure/database/prisma");
    const [route, student] = await Promise.all([
      prisma.transportRoute.findFirst({
        where: { id: routeId, tenantId: session.user.tenantId },
      }),
      prisma.student.findFirst({
        where: {
          id: studentId,
          tenantId: session.user.tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          nameBn: true,
          studentId: true,
          fatherPhone: true,
          guardianPhone: true,
        },
      }),
    ]);

    const assignment = await operationsRepository.assignStudent({
      tenantId: session.user.tenantId,
      routeId,
      studentId,
      pickupPoint,
    });

    let smsNote = "";
    const phone = student?.guardianPhone || student?.fatherPhone;
    if (phone && route && student) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const routeName = route.nameBn || route.name;
        const pickup = pickupPoint ? ` পিকআপ: ${pickupPoint}.` : "";
        const vehicle = route.vehicleNo ? ` যান: ${route.vehicleNo}.` : "";
        const driver = route.driverName
          ? ` ড্রাইভার: ${route.driverName}${route.driverPhone ? " (" + route.driverPhone + ")" : ""}.`
          : "";
        const body = `ট্রান্সপোর্ট: ${student.nameBn || student.name} (${student.studentId}) — রুট ${routeName}.${vehicle}${driver}${pickup} মাসিক ফি ৳${route.monthlyFee.toLocaleString("en-BD")}। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Transport assignment",
          body,
          relatedType: "TRANSPORT",
          relatedId: assignment.id,
        });
        smsNote = " · অভিভাবক SMS পাঠানো হয়েছে";
      } catch (smsErr) {
        console.error("transport SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/transport");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `ট্রান্সপোর্ট অ্যাসাইন হয়েছে${smsNote}`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { error: "এই শিক্ষার্থী ইতিমধ্যে এই রুটে আছে" };
    }
    return { error: "অ্যাসাইনমেন্ট ব্যর্থ" };
  }
}

export async function notifyOverdueBooksAction(
  _p: OpsState,
  formData: FormData
): Promise<OpsState> {
  const session = await tenantSession();
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  try {
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );

    const list = await operationsRepository.listOverdueIssues(
      session.user.tenantId,
      200
    );
    if (list.length === 0) {
      return { error: "কোনো ওভারডিউ বই নেই" };
    }

    let sent = 0;
    for (const issue of list) {
      if (!issue.student?.phone) continue;
      const title = issue.book.titleBn || issue.book.title;
      const body = `লাইব্রেরি: "${title}" ফেরত বাকি — ${issue.student.name} (${issue.student.code}), ${issue.daysLate} দিন দেরি, ডিউ ${issue.dueDate.toLocaleDateString("en-GB")}। অনুগ্রহ করে ফেরত দিন। — Edupro`;
      try {
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: issue.student.phone,
          subject: "Library overdue",
          body,
          relatedType: "LIBRARY_OVERDUE",
          relatedId: issue.id,
        });
        sent += 1;
      } catch {
        /* continue */
      }
    }

    revalidatePath("/tenant/admin/library");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `${sent}/${list.length} ওভারডিউ রিমাইন্ডার পাঠানো হয়েছে`,
    };
  } catch (e) {
    console.error(e);
    return { error: "লাইব্রেরি SMS ব্যর্থ" };
  }
}
