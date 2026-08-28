"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type SiblingState = { error?: string; success?: boolean; message?: string };

/** Link two students under same siblingGroupId (family) */
export async function linkSiblingsAction(
  _prev: SiblingState,
  formData: FormData
): Promise<SiblingState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };
  const tid = session.user.tenantId;
  const a = String(formData.get("studentIdA") || "").trim();
  const b = String(formData.get("studentIdB") || "").trim();
  if (!a || !b || a === b) return { error: "দুইটি আলাদা student ID দিন" };

  try {
    const [sa, sb] = await Promise.all([
      prisma.student.findFirst({
        where: { tenantId: tid, studentId: a, deletedAt: null },
      }),
      prisma.student.findFirst({
        where: { tenantId: tid, studentId: b, deletedAt: null },
      }),
    ]);
    if (!sa || !sb) return { error: "এক বা উভয় শিক্ষার্থী পাওয়া যায়নি" };

    const groupId =
      sa.siblingGroupId || sb.siblingGroupId || `fam_${Date.now().toString(36)}`;

    await prisma.student.updateMany({
      where: { id: { in: [sa.id, sb.id] } },
      data: { siblingGroupId: groupId },
    });

    revalidatePath("/tenant/admin/students");
    revalidatePath("/tenant/admin/students/siblings");
    return {
      success: true,
      message: `লিংক হয়েছে · group ${groupId}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "লিংক ব্যর্থ" };
  }
}

/** Attach document metadata to student documentsJson */
export async function addStudentDocumentAction(
  _prev: SiblingState,
  formData: FormData
): Promise<SiblingState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };
  const tid = session.user.tenantId;
  const studentId = String(formData.get("studentId") || "").trim();
  const name = String(formData.get("docName") || "").trim();
  const url = String(formData.get("docUrl") || "").trim();
  const type = String(formData.get("docType") || "OTHER").trim();
  if (!studentId || !name || !url) return { error: "ID, নাম ও URL প্রয়োজন" };

  try {
    const st = await prisma.student.findFirst({
      where: { tenantId: tid, studentId, deletedAt: null },
    });
    if (!st) return { error: "শিক্ষার্থী নেই" };
    let docs: { name: string; url: string; type: string; at: string }[] = [];
    try {
      docs = st.documentsJson ? JSON.parse(st.documentsJson) : [];
    } catch {
      docs = [];
    }
    docs.push({ name, url, type, at: new Date().toISOString() });
    await prisma.student.update({
      where: { id: st.id },
      data: { documentsJson: JSON.stringify(docs) },
    });
    revalidatePath("/tenant/admin/students");
    return { success: true, message: "ডকুমেন্ট যোগ হয়েছে" };
  } catch {
    return { error: "সংরক্ষণ ব্যর্থ" };
  }
}
