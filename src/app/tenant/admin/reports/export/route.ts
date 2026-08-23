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
 * BANBEIS-oriented student census export (CSV).
 * Columns aligned with common board reporting needs.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await prisma.student.findMany({
    where: {
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
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
  const filename = `banbeis-students-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
