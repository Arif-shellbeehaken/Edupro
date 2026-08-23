import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const certificateRepository = {
  async list(tenantId?: string, take = 50) {
    const tid = tenantId ?? requireTenantId();
    return prisma.certificate.findMany({
      where: { tenantId: tid },
      orderBy: { issueDate: "desc" },
      take,
    });
  },

  async issue(data: {
    tenantId: string;
    studentId?: string;
    certType: string;
    studentName: string;
    studentNameBn?: string;
    fatherName?: string;
    className?: string;
    remarks?: string;
    issuedById?: string;
  }) {
    const year = new Date().getFullYear();
    const count = await prisma.certificate.count({
      where: { tenantId: data.tenantId },
    });
    const certificateNo = `CERT-${year}-${String(count + 1).padStart(5, "0")}`;

    return prisma.certificate.create({
      data: {
        tenantId: data.tenantId,
        studentId: data.studentId,
        certType: data.certType,
        certificateNo,
        studentName: data.studentName,
        studentNameBn: data.studentNameBn,
        fatherName: data.fatherName,
        className: data.className,
        remarks: data.remarks,
        issuedById: data.issuedById,
        status: "ISSUED",
      },
    });
  },

  async cancel(id: string, tenantId: string) {
    return prisma.certificate.updateMany({
      where: { id, tenantId, status: "ISSUED" },
      data: { status: "CANCELLED" },
    });
  },
};
