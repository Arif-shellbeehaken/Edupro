"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type SeatingState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * Generate simple sequential seating (Room capacity) and SMS guardians.
 * Rooms list: "A-1:30,B-1:25" capacity after colon.
 */
export async function publishExamSeatingAction(
  _prev: SeatingState,
  formData: FormData
): Promise<SeatingState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const examId = String(formData.get("examId") || "");
  const classId = String(formData.get("classId") || "") || undefined;
  const roomsRaw = String(formData.get("rooms") || "Hall-A:40,Hall-B:40").trim();
  const notify = formData.get("notify") !== "off";
  if (!examId) return { error: "পরীক্ষা বাছুন" };

  try {
    const exam = await prisma.exam.findFirst({
      where: { id: examId, tenantId: session.user.tenantId },
    });
    if (!exam) return { error: "পরীক্ষা পাওয়া যায়নি" };

    const rooms: { name: string; capacity: number }[] = [];
    for (const part of roomsRaw.split(",")) {
      const [name, cap] = part.trim().split(":");
      if (!name) continue;
      rooms.push({ name: name.trim(), capacity: Math.max(1, Number(cap) || 40) });
    }
    if (rooms.length === 0) return { error: "রুম তালিকা দিন" };

    const students = await prisma.student.findMany({
      where: {
        tenantId: session.user.tenantId,
        deletedAt: null,
        status: "ACTIVE",
        ...(classId ? { currentClassId: classId } : {}),
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherPhone: true,
        guardianPhone: true,
      },
      orderBy: { studentId: "asc" },
      take: 500,
    });

    if (students.length === 0) return { error: "শিক্ষার্থী নেই" };

    // Assign seats
    type Seat = {
      student: (typeof students)[0];
      room: string;
      seatNo: number;
    };
    const seats: Seat[] = [];
    let ri = 0;
    let seatInRoom = 0;
    for (const st of students) {
      if (ri >= rooms.length) break;
      seatInRoom += 1;
      if (seatInRoom > rooms[ri]!.capacity) {
        ri += 1;
        seatInRoom = 1;
        if (ri >= rooms.length) break;
      }
      seats.push({
        student: st,
        room: rooms[ri]!.name,
        seatNo: seatInRoom,
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "EXAM_SEATING",
        entityType: "Exam",
        entityId: examId,
        newValues: {
          rooms: roomsRaw,
          assigned: seats.length,
          exam: exam.name,
        },
      },
    });

    let sent = 0;
    if (notify) {
      const { communicationRepository } = await import(
        "@/infrastructure/database/repositories/communication-repository"
      );
      const examName = exam.nameBn || exam.name;
      const dateLabel = exam.startDate
        ? exam.startDate.toLocaleDateString("en-GB")
        : "";
      for (const s of seats) {
        const phone = s.student.guardianPhone || s.student.fatherPhone;
        if (!phone) continue;
        const body = `সীট প্ল্যান: ${s.student.nameBn || s.student.name} (${s.student.studentId}) — ${examName}${dateLabel ? " " + dateLabel : ""}, রুম ${s.room}, সীট ${s.seatNo}। সময়মতো উপস্থিত হোন। — Edupro`;
        try {
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Exam seating",
            body,
            relatedType: "EXAM_SEATING",
            relatedId: examId,
          });
          sent += 1;
        } catch {
          /* continue */
        }
      }
    }

    revalidatePath("/tenant/admin/exams");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `সীট ${seats.length} · SMS ${sent}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "সীট প্ল্যান ব্যর্থ" };
  }
}
