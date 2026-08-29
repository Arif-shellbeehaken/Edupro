import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId } from "@/lib/logger";

export async function GET(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session) return error!;

  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Parent only" }, { status: 403 });
  }

  const phone =
    session.user.email?.replace("@parent.local", "") ||
    session.user.id?.replace("parent:", "") ||
    "";

  if (!phone || !session.user.tenantId) {
    return NextResponse.json({ error: "Invalid parent session" }, { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: {
      tenantId: session.user.tenantId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ guardianPhone: phone }, { fatherPhone: phone }],
    },
    include: {
      currentClass: { select: { name: true, nameBn: true } },
      invoices: { take: 5, orderBy: { issueDate: "desc" } },
      attendances: { take: 10, orderBy: { date: "desc" } },
    },
    take: 20,
  });

  return jsonData(
    students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      name: s.nameBn || s.name,
      className: s.currentClass?.nameBn || s.currentClass?.name,
      invoices: s.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
        status: inv.status,
      })),
      attendances: s.attendances.map((a) => ({
        date: a.date.toISOString().slice(0, 10),
        status: a.status,
      })),
    })),
    requestId
  );
}
