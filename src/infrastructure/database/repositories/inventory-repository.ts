import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const inventoryRepository = {
  async listItems(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    return prisma.inventoryItem.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async createItem(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    sku?: string;
    category?: string;
    unit?: string;
    quantity?: number;
    minStock?: number;
    unitCost?: number;
    location?: string;
  }) {
    return prisma.inventoryItem.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        sku: data.sku || undefined,
        category: data.category,
        unit: data.unit ?? "pcs",
        quantity: data.quantity ?? 0,
        minStock: data.minStock ?? 5,
        unitCost: data.unitCost ?? 0,
        location: data.location,
      },
    });
  },

  async stockTxn(data: {
    tenantId: string;
    itemId: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    note?: string;
    performedById?: string;
  }) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: data.itemId, tenantId: data.tenantId },
    });
    if (!item) throw new Error("আইটেম পাওয়া যায়নি");

    let newQty = item.quantity;
    if (data.type === "IN") newQty += data.quantity;
    else if (data.type === "OUT") {
      if (item.quantity < data.quantity) throw new Error("পর্যাপ্ত স্টক নেই");
      newQty -= data.quantity;
    } else {
      newQty = data.quantity; // ADJUST sets absolute
    }

    return prisma.$transaction(async (tx) => {
      const txn = await tx.inventoryTxn.create({
        data: {
          tenantId: data.tenantId,
          itemId: data.itemId,
          type: data.type,
          quantity: data.quantity,
          note: data.note,
          performedById: data.performedById,
        },
      });
      await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: { quantity: newQty },
      });
      return txn;
    });
  },

  async lowStockItems(tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId: tid, isActive: true },
    });
    return items.filter((i) => i.quantity <= i.minStock);
  },
};
