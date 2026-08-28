import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const rows = await prisma.certificate.findMany({
      where: { tenantId },
      orderBy: { issueDate: "desc" },
      take,
      select: {
        id: true,
        certType: true,
        certificateNo: true,
        issueDate: true,
        studentName: true,
        studentNameBn: true,
        className: true,
        status: true,
      },
    });
    return jsonData(
      rows.map((r) => ({
        id: r.id,
        type: r.certType,
        certificateNo: r.certificateNo,
        issuedAt: r.issueDate?.toISOString().slice(0, 10) ?? null,
        studentName: r.studentNameBn || r.studentName,
        className: r.className,
        status: r.status,
      })),
      requestId
    );
  });
}
