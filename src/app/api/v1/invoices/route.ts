import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 50), 100);
    const rows = await prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { issueDate: "desc" },
      take,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        issueDate: true,
        dueDate: true,
        student: { select: { name: true, nameBn: true, studentId: true } },
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
        status: r.status,
        issueDate: r.issueDate.toISOString().slice(0, 10),
        dueDate: r.dueDate?.toISOString().slice(0, 10) ?? null,
        studentName: r.student?.nameBn || r.student?.name,
        studentCode: r.student?.studentId,
      })),
      requestId,
      { take }
    );
  });
}
