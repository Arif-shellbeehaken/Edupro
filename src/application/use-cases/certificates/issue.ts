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
  message?: string;
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

  let studentPhone: string | undefined;
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
      studentPhone = s.guardianPhone || s.fatherPhone || undefined;
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

    // TRANSFER TC: release student from active roll
    if (certType === "TRANSFER" && studentId) {
      await prisma.student.updateMany({
        where: { id: studentId, tenantId: session.user.tenantId },
        data: { status: "LEFT" },
      });
      revalidatePath("/tenant/admin/students");
    }

    let smsNote = "";
    if (studentPhone) {
      try {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const TYPE_BN: Record<string, string> = {
          TRANSFER: "টিসি",
          CHARACTER: "চারিত্রিক",
          TESTIMONIAL: "টেস্টিমোনিয়াল",
          COMPLETION: "সমাপন",
          BONAFIDE: "বোনাফাইড",
        };
        const typeBn = TYPE_BN[certType] || certType;
        const body = `সার্টিফিকেট প্রস্তুত: ${studentNameBn || studentName} — ${typeBn}, নং ${cert.certificateNo}। প্রিন্ট রেডি। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: studentPhone,
          subject: `Certificate ${certType}`,
          body,
          relatedType: "CERTIFICATE",
          relatedId: cert.id,
        });
        smsNote = " · প্রিন্ট-রেডি SMS";
      } catch (smsErr) {
        console.error("cert SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/certificates");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      certificateNo: cert.certificateNo,
      message: `ইস্যু: ${cert.certificateNo}${smsNote}`,
    };
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
    const cert = await prisma.certificate.findFirst({
      where: { id, tenantId: session.user.tenantId },
    });
    if (!cert) return { error: "সার্টিফিকেট পাওয়া যায়নি" };

    await certificateRepository.cancel(id, session.user.tenantId);

    let smsNote = "";
    if (cert.studentId) {
      try {
        const student = await prisma.student.findFirst({
          where: { id: cert.studentId, tenantId: session.user.tenantId },
          select: {
            name: true,
            nameBn: true,
            studentId: true,
            fatherPhone: true,
            guardianPhone: true,
          },
        });
        const phone = student?.guardianPhone || student?.fatherPhone;
        if (phone && student) {
          const { communicationRepository } = await import(
            "@/infrastructure/database/repositories/communication-repository"
          );
          const body = `সার্টিফিকেট বাতিল: ${student.nameBn || student.name} (${student.studentId}) — নং ${cert.certificateNo} (${cert.certType}) বাতিল করা হয়েছে। — Edupro`;
          await communicationRepository.sendMessage({
            tenantId: session.user.tenantId,
            channel: "SMS",
            recipient: phone,
            subject: "Certificate cancelled",
            body,
            relatedType: "CERTIFICATE_CANCEL",
            relatedId: cert.id,
          });
          smsNote = " · SMS";
        }
      } catch (smsErr) {
        console.error("cert cancel SMS", smsErr);
      }
    }

    revalidatePath("/tenant/admin/certificates");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      message: `বাতিল সম্পন্ন${smsNote}`,
      certificateNo: cert.certificateNo,
    };
  } catch (e) {
    console.error(e);
    return { error: "বাতিল ব্যর্থ" };
  }
}


/** Mark certificate in print queue and SMS guardian again */
export async function notifyCertificatePrintReadyAction(
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

  const id = String(formData.get("certId") || "");
  if (!id) return { error: "সার্টিফিকেট বাছুন" };

  try {
    const cert = await prisma.certificate.findFirst({
      where: { id, tenantId: session.user.tenantId, status: "ISSUED" },
    });
    if (!cert) return { error: "ইস্যুকৃত সার্টিফিকেট পাওয়া যায়নি" };

    // Audit print-queue event
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
          action: "CERTIFICATE_PRINT_QUEUE",
          entityType: "Certificate",
          entityId: cert.id,
          newValues: { certificateNo: cert.certificateNo, certType: cert.certType },
        },
      });
    } catch {
      /* optional */
    }

    let smsNote = "";
    if (cert.studentId) {
      const student = await prisma.student.findFirst({
        where: { id: cert.studentId, tenantId: session.user.tenantId },
        select: {
          name: true,
          nameBn: true,
          studentId: true,
          fatherPhone: true,
          guardianPhone: true,
        },
      });
      const phone = student?.guardianPhone || student?.fatherPhone;
      if (phone && student) {
        const { communicationRepository } = await import(
          "@/infrastructure/database/repositories/communication-repository"
        );
        const body = `সার্টিফিকেট প্রিন্ট কিউ: ${student.nameBn || student.name} (${student.studentId}) — ${cert.certType} নং ${cert.certificateNo} প্রিন্টের জন্য প্রস্তুত। অফিস থেকে সংগ্রহ করুন। — Edupro`;
        await communicationRepository.sendMessage({
          tenantId: session.user.tenantId,
          channel: "SMS",
          recipient: phone,
          subject: "Certificate print ready",
          body,
          relatedType: "CERTIFICATE_PRINT",
          relatedId: cert.id,
        });
        smsNote = " · SMS";
      }
    }

    revalidatePath("/tenant/admin/certificates");
    revalidatePath("/tenant/admin/communication");
    return {
      success: true,
      certificateNo: cert.certificateNo,
      message: `প্রিন্ট কিউ: ${cert.certificateNo}${smsNote}`,
    };
  } catch (e) {
    console.error(e);
    return { error: "প্রিন্ট কিউ ব্যর্থ" };
  }
}
