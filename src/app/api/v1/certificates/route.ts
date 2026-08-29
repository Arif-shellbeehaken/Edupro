import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { withApiV1, jsonData } from "@/lib/api-v1-helpers";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { certificateRepository } from "@/infrastructure/database/repositories/certificate-repository";

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

const createSchema = z.object({
  studentName: z.string().min(1),
  studentNameBn: z.string().optional(),
  studentId: z.string().optional(),
  certType: z.string().default("CHARACTER"),
  fatherName: z.string().optional(),
  className: z.string().optional(),
  remarks: z.string().optional(),
});

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const role = session.user.role || "";
  if (!["ADMIN", "SUPER_ADMIN"].includes(role) && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "studentName প্রয়োজন" }, { status: 400 });
  }
  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: !!session.user.isSuperAdmin,
  });
  try {
    const cert = await certificateRepository.issue({
      tenantId: session.user.tenantId,
      studentName: parsed.data.studentName,
      studentNameBn: parsed.data.studentNameBn,
      studentId: parsed.data.studentId,
      certType: parsed.data.certType,
      fatherName: parsed.data.fatherName,
      className: parsed.data.className,
      remarks: parsed.data.remarks,
      issuedById: session.user.id,
    });
    return NextResponse.json({ data: cert, meta: { requestId } }, { status: 201 });
  } catch (e) {
    logger.error("cert_issue", { requestId, err: String(e) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
