import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const financeRepository = {
  async listFeeStructures(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.feeStructure.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async createFeeStructure(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    feeType: string;
    amount: number;
    classId?: string;
    isRecurring?: boolean;
    dueDay?: number;
  }) {
    return prisma.feeStructure.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        feeType: data.feeType,
        amount: data.amount,
        classId: data.classId,
        isRecurring: data.isRecurring ?? true,
        dueDay: data.dueDay,
      },
    });
  },

  async listInvoices(options?: {
    tenantId?: string;
    studentId?: string;
    status?: string;
    take?: number;
  }) {
    const tid = options?.tenantId ?? requireTenantId();
    return prisma.invoice.findMany({
      where: {
        tenantId: tid,
        ...(options?.studentId ? { studentId: options.studentId } : {}),
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { issueDate: "desc" },
      take: options?.take ?? 50,
      include: {
        student: {
          select: { id: true, name: true, nameBn: true, studentId: true },
        },
        payments: true,
      },
    });
  },

  async createInvoice(data: {
    tenantId: string;
    studentId: string;
    totalAmount: number;
    dueDate: Date;
    notes?: string;
    discountAmount?: number;
  }) {
    const count = await prisma.invoice.count({
      where: { tenantId: data.tenantId },
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    return prisma.invoice.create({
      data: {
        tenantId: data.tenantId,
        studentId: data.studentId,
        invoiceNumber,
        status: "ISSUED",
        dueDate: data.dueDate,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount ?? 0,
        notes: data.notes,
      },
    });
  },

  async recordPayment(data: {
    tenantId: string;
    invoiceId: string;
    amount: number;
    method: string;
    transactionId?: string;
    receivedById?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, tenantId: data.tenantId },
      });
      if (!invoice) throw new Error("Invoice not found");

      const payment = await tx.payment.create({
        data: {
          tenantId: data.tenantId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          status: "COMPLETED",
          transactionId: data.transactionId,
          receivedById: data.receivedById,
          notes: data.notes,
        },
      });

      const newPaid = invoice.paidAmount + data.amount;
      let status = invoice.status;
      if (newPaid >= invoice.totalAmount - invoice.discountAmount) {
        status = "PAID";
      } else if (newPaid > 0) {
        status = "PARTIALLY_PAID";
      }

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { paidAmount: newPaid, status },
      });

      return payment;
    });
  },

  async collectionSummary(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: tid },
      select: { totalAmount: true, paidAmount: true, status: true },
    });
    const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
    return {
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      invoiceCount: invoices.length,
    };
  },
};
