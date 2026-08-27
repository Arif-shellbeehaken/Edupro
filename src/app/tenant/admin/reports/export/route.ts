import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { NextResponse } from "next/server";

function csvEscape(v: string | number | null | undefined) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * BANBEIS / EMIS oriented CSV exports.
 * ?type=students | staff | attendance
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tid = session.user.tenantId;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "students";
  const date = new Date().toISOString().slice(0, 10);

  if (type === "staff") {
    const staff = await prisma.staff.findMany({
      where: { tenantId: tid, deletedAt: null },
      orderBy: { employeeId: "asc" },
    });
    const headers = [
      "employee_id",
      "name",
      "name_bn",
      "gender",
      "designation",
      "department",
      "role_type",
      "employment_type",
      "phone",
      "email",
      "joining_date",
      "status",
      "basic_salary",
    ];
    const rows = staff.map((s) =>
      [
        s.employeeId,
        s.name,
        s.nameBn,
        s.gender,
        s.designation,
        s.department,
        s.roleType,
        s.employmentType,
        s.phone,
        s.email,
        s.joiningDate ? s.joiningDate.toISOString().slice(0, 10) : "",
        s.status,
        s.basicSalary,
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="emis-staff-${date}.csv"`,
      },
    });
  }

  if (type === "attendance") {
    // Last 30 days summary per student
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const students = await prisma.student.findMany({
      where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        studentId: true,
        name: true,
        nameBn: true,
        currentClass: { select: { name: true, nameBn: true } },
      },
      take: 2000,
    });
    const att = await prisma.attendance.findMany({
      where: {
        tenantId: tid,
        date: { gte: since },
        studentId: { in: students.map((s) => s.id) },
      },
      select: { studentId: true, status: true },
    });
    const map = new Map<string, { present: number; absent: number; late: number }>();
    for (const a of att) {
      if (!a.studentId) continue;
      const cur = map.get(a.studentId) || { present: 0, absent: 0, late: 0 };
      if (a.status === "PRESENT") cur.present += 1;
      else if (a.status === "ABSENT") cur.absent += 1;
      else if (a.status === "LATE") cur.late += 1;
      map.set(a.studentId, cur);
    }
    const headers = [
      "student_id",
      "name",
      "class",
      "present_30d",
      "absent_30d",
      "late_30d",
      "attendance_pct",
    ];
    const rows = students.map((s) => {
      const c = map.get(s.id) || { present: 0, absent: 0, late: 0 };
      const total = c.present + c.absent + c.late;
      const pct =
        total > 0
          ? Math.round(((c.present + c.late * 0.5) / total) * 1000) / 10
          : "";
      return [
        s.studentId,
        s.nameBn || s.name,
        s.currentClass?.nameBn || s.currentClass?.name || "",
        c.present,
        c.absent,
        c.late,
        pct,
      ]
        .map(csvEscape)
        .join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="emis-attendance-30d-${date}.csv"`,
      },
    });
  }

  // default: students BANBEIS census
  const students = await prisma.student.findMany({
    where: { tenantId: tid, deletedAt: null },
    include: {
      currentClass: { select: { name: true, nameBn: true } },
      currentSection: { select: { name: true } },
      hifzProgress: { select: { totalJuzCompleted: true } },
    },
    orderBy: { studentId: "asc" },
  });

  const headers = [
    "student_id",
    "name",
    "name_bn",
    "gender",
    "date_of_birth",
    "class",
    "section",
    "father_name",
    "father_phone",
    "status",
    "is_hifz",
    "hifz_juz",
    "admission_date",
  ];

  const rows = students.map((s) =>
    [
      s.studentId,
      s.name,
      s.nameBn,
      s.gender,
      s.dateOfBirth ? s.dateOfBirth.toISOString().slice(0, 10) : "",
      s.currentClass?.nameBn || s.currentClass?.name || "",
      s.currentSection?.name || "",
      s.fatherName,
      s.fatherPhone,
      s.status,
      s.isHifzStudent ? "YES" : "NO",
      s.hifzProgress?.totalJuzCompleted ?? "",
      s.admissionDate ? s.admissionDate.toISOString().slice(0, 10) : "",
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="banbeis-students-${date}.csv"`,
    },
  });
}
