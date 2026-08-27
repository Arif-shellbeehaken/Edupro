import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { NextResponse } from "next/server";

/**
 * Tenant data backup export (JSON) — admin only.
 * GET /tenant/admin/system/backup
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (
    !session.user.isSuperAdmin &&
    !["INSTITUTION_ADMIN", "PRINCIPAL", "ADMIN"].includes(role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tid = session.user.tenantId;
  const date = new Date().toISOString().slice(0, 10);

  try {
    const [
      tenant,
      students,
      staff,
      classes,
      invoices,
      audit,
    ] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tid },
        select: {
          id: true,
          name: true,
          nameBn: true,
          slug: true,
          type: true,
          plan: true,
          email: true,
          phone: true,
          address: true,
        },
      }),
      prisma.student.findMany({
        where: { tenantId: tid, deletedAt: null },
        select: {
          studentId: true,
          name: true,
          nameBn: true,
          gender: true,
          status: true,
          fatherPhone: true,
          guardianPhone: true,
          currentClassId: true,
          admissionDate: true,
        },
        take: 5000,
      }),
      prisma.staff.findMany({
        where: { tenantId: tid, deletedAt: null },
        select: {
          employeeId: true,
          name: true,
          nameBn: true,
          designation: true,
          roleType: true,
          phone: true,
          status: true,
          basicSalary: true,
        },
        take: 2000,
      }),
      prisma.class.findMany({
        where: { tenantId: tid, deletedAt: null },
        select: { id: true, name: true, nameBn: true, level: true, board: true },
        take: 200,
      }),
      prisma.invoice.findMany({
        where: { tenantId: tid },
        select: {
          invoiceNumber: true,
          studentId: true,
          totalAmount: true,
          status: true,
          issueDate: true,
          dueDate: true,
        },
        take: 5000,
        orderBy: { issueDate: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { tenantId: tid },
        select: {
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      tenant,
      counts: {
        students: students.length,
        staff: staff.length,
        classes: classes.length,
        invoices: invoices.length,
        audit: audit.length,
      },
      students,
      staff,
      classes,
      invoices,
      auditRecent: audit,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="edupro-backup-${tenant?.slug || tid}-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("tenant backup", e);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
