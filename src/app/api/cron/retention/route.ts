import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

/**
 * Data retention / GDPR-oriented cleanup job.
 * Auth: Authorization: Bearer $CRON_SECRET  or  ?secret=
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const auth =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(req.url).searchParams.get("secret") ||
    "";

  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auditDays = Number(process.env.RETENTION_AUDIT_DAYS || 730);
  const messageDays = Number(process.env.RETENTION_MESSAGE_DAYS || 180);
  const softDeleteDays = Number(process.env.RETENTION_SOFT_DELETE_DAYS || 365);
  const hardDelete = process.env.RETENTION_HARD_DELETE === "true";

  const now = Date.now();
  const auditBefore = new Date(now - auditDays * 86400000);
  const msgBefore = new Date(now - messageDays * 86400000);
  const softBefore = new Date(now - softDeleteDays * 86400000);

  const result: Record<string, number> = {};

  try {
    const audit = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: auditBefore } },
    });
    result.auditDeleted = audit.count;

    const messages = await prisma.messageLog.deleteMany({
      where: { createdAt: { lt: msgBefore } },
    });
    result.messagesDeleted = messages.count;

    if (hardDelete) {
      const students = await prisma.student.deleteMany({
        where: { deletedAt: { lt: softBefore } },
      });
      result.studentsHardDeleted = students.count;

      const staff = await prisma.staff.deleteMany({
        where: { deletedAt: { lt: softBefore } },
      });
      result.staffHardDeleted = staff.count;
    } else {
      result.studentsHardDeleted = 0;
      result.staffHardDeleted = 0;
    }

    return NextResponse.json({
      status: "ok",
      ranAt: new Date().toISOString(),
      policy: { auditDays, messageDays, softDeleteDays, hardDelete },
      result,
    });
  } catch (e) {
    console.error("retention job", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
