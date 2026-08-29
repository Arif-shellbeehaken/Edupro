import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { newRequestId, logger } from "@/lib/logger";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

/**
 * GET /api/v1/students?status=ACTIVE&take=50
 * REST surface for mobile / integrations.
 */
export async function GET(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session) return error!;
  if (!session.user.tenantId && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "No tenant" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "ACTIVE";
  const take = Math.min(Number(url.searchParams.get("take") || 50), 200);
  const tid = session.user.tenantId!;

  try {
    const students = await prisma.student.findMany({
      where: { tenantId: tid, deletedAt: null, status },
      select: {
        id: true,
        studentId: true,
        name: true,
        nameBn: true,
        gender: true,
        status: true,
        rollNumber: true,
        currentClassId: true,
        guardianPhone: true,
      },
      orderBy: { studentId: "asc" },
      take,
    });
    logger.info("api_v1_students", { requestId, count: students.length });
    return NextResponse.json(
      { data: students, meta: { take, requestId } },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_students_fail", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
