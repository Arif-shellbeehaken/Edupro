import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const [
      students,
      staff,
      invoicesOpen,
      notices,
      homework,
      exams,
    ] = await Promise.all([
      prisma.student.count({ where: { tenantId, deletedAt: null, status: "ACTIVE" } }),
      prisma.staff.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.invoice.count({
        where: { tenantId, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } },
      }),
      prisma.notice.count({ where: { tenantId, isPublished: true } }),
      prisma.homework.count({ where: { tenantId } }),
      prisma.exam.count({ where: { tenantId } }),
    ]);
    return jsonData(
      { students, staff, invoicesOpen, notices, homework, exams },
      requestId
    );
  });
}
