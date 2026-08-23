"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/infrastructure/auth/rbac";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { certificateRepository } from "@/infrastructure/database/repositories/certificate-repository";
import { prisma } from "@/infrastructure/database/prisma";

export type CertState = {
  error?: string;
  success?: boolean;
  certificateNo?: string;
};

export async function issueCertificateAction(
  _prev: CertState,
  formData: FormData
): Promise<CertState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  const certType = formData.get("certType") as string;
  const studentId = (formData.get("studentId") as string) || undefined;
  let studentName = (formData.get("studentName") as string)?.trim();
  let studentNameBn = (formData.get("studentNameBn") as string) || undefined;
  let fatherName = (formData.get("fatherName") as string) || undefined;
  let className = (formData.get("className") as string) || undefined;

  if (studentId) {
    const s = await prisma.student.findFirst({
      where: { id: studentId, tenantId: session.user.tenantId },
      include: { currentClass: true },
    });
    if (s) {
      studentName = s.name;
      studentNameBn = s.nameBn ?? undefined;
      fatherName = s.fatherName ?? undefined;
      className = s.currentClass?.nameBn || s.currentClass?.name || className;
    }
  }

  if (!studentName || !certType) {
    return { error: "নাম ও সার্টিফিকেট টাইপ আবশ্যক" };
  }

  try {
    const cert = await certificateRepository.issue({
      tenantId: session.user.tenantId,
      studentId,
      certType,
      studentName,
      studentNameBn,
      fatherName,
      className,
      remarks: (formData.get("remarks") as string) || undefined,
      issuedById: session.user.id,
    });
    revalidatePath("/tenant/admin/certificates");
    return { success: true, certificateNo: cert.certificateNo };
  } catch (e) {
    console.error(e);
    return { error: "সার্টিফিকেট ইস্যু ব্যর্থ" };
  }
}

export async function cancelCertificateAction(
  _prev: CertState,
  formData: FormData
): Promise<CertState> {
  const session = await requireTenantContext().catch(() => null);
  if (!session?.user.tenantId) return { error: "অনুমতি নেই" };

  const id = formData.get("certId") as string;
  if (!id) return { error: "আইডি দরকার" };

  try {
    await certificateRepository.cancel(id, session.user.tenantId);
    revalidatePath("/tenant/admin/certificates");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "বাতিল ব্যর্থ" };
  }
}
