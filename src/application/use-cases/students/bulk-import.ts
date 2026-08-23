"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { prisma } from "@/infrastructure/database/prisma";

export type BulkImportState = {
  error?: string;
  success?: boolean;
  created?: number;
  skipped?: number;
  message?: string;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * CSV columns (header row required):
 * name, name_bn, gender, student_id, father_name, father_phone, guardian_phone, is_hifz
 * gender: MALE | FEMALE | OTHER
 * is_hifz: YES | NO
 */
export async function bulkImportStudentsAction(
  _prev: BulkImportState,
  formData: FormData
): Promise<BulkImportState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const file = formData.get("file") as File | null;
  const paste = (formData.get("csvText") as string) || "";

  let text = paste;
  if (file && file.size > 0) {
    text = await file.text();
  }

  if (!text.trim()) {
    return { error: "CSV ফাইল বা টেক্সট দিন" };
  }

  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { error: "কোনো ডাটা রো নেই — হেডার + অন্তত ১টি রো দরকার" };
  }

  let created = 0;
  let skipped = 0;
  const year = new Date().getFullYear();

  try {
    let seq = await prisma.student.count({
      where: { tenantId: session.user.tenantId },
    });

    for (const row of rows) {
      const name = row.name || row["name_en"] || row["student_name"];
      if (!name) {
        skipped++;
        continue;
      }

      const gender = (row.gender || "MALE").toUpperCase();
      if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
        skipped++;
        continue;
      }

      seq += 1;
      const studentId =
        row.student_id ||
        row.studentid ||
        `STU-${year}-${String(seq).padStart(4, "0")}`;

      const exists = await prisma.student.findFirst({
        where: {
          tenantId: session.user.tenantId,
          studentId,
        },
      });
      if (exists) {
        skipped++;
        continue;
      }

      const isHifz =
        (row.is_hifz || row.hifz || "").toUpperCase() === "YES" ||
        row.is_hifz === "1";

      await prisma.student.create({
        data: {
          tenantId: session.user.tenantId,
          studentId,
          name,
          nameBn: row.name_bn || row.namebn || undefined,
          gender,
          fatherName: row.father_name || row.fathername || undefined,
          fatherPhone: row.father_phone || row.fatherphone || undefined,
          guardianPhone: row.guardian_phone || row.guardianphone || undefined,
          status: "ACTIVE",
          isHifzStudent: isHifz,
          admissionDate: new Date(),
        },
      });
      created++;
    }

    revalidatePath("/tenant/admin/students");
    revalidatePath("/tenant/admin/students/import");
    return {
      success: true,
      created,
      skipped,
      message: `${created} জন যোগ, ${skipped} স্কিপ`,
    };
  } catch (e) {
    console.error(e);
    return { error: "ইমপোর্ট ব্যর্থ — CSV ফরম্যাট চেক করুন" };
  }
}
