import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";

export async function GET(req: Request) {
  return withApiV1(req, async ({ requestId, tenantId }) => {
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") || 40), 100);
    const issues = await prisma.bookIssue.findMany({
      where: { tenantId, returnedAt: null },
      take,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        dueDate: true,
        issuedAt: true,
        studentId: true,
        book: { select: { title: true, titleBn: true } },
      },
    });
    const sids = [...new Set(issues.map((i) => i.studentId).filter(Boolean))] as string[];
    const students = sids.length
      ? await prisma.student.findMany({
          where: { tenantId, id: { in: sids } },
          select: { id: true, name: true, nameBn: true, studentId: true },
        })
      : [];
    const byId = Object.fromEntries(students.map((s) => [s.id, s]));
    return jsonData(
      issues.map((r) => {
        const st = r.studentId ? byId[r.studentId] : null;
        return {
          id: r.id,
          bookTitle: r.book?.titleBn || r.book?.title,
          studentName: st?.nameBn || st?.name || null,
          studentCode: st?.studentId || null,
          issuedAt: r.issuedAt.toISOString().slice(0, 10),
          dueDate: r.dueDate?.toISOString().slice(0, 10) ?? null,
        };
      }),
      requestId
    );
  });
}
