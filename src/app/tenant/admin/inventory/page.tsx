import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { inventoryRepository } from "@/infrastructure/database/repositories/inventory-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryForms } from "./inventory-forms";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let items: Awaited<ReturnType<typeof inventoryRepository.listItems>> = [];
  let lowStock: Awaited<ReturnType<typeof inventoryRepository.lowStockItems>> = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
      items = await inventoryRepository.listItems();
      lowStock = await inventoryRepository.lowStockItems();
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ইনভেন্টরি"
          subtitle="স্টক · ইন/আউট · লো-স্টক অ্যালার্ট"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">আইটেম</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{items.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মোট স্টক ইউনিট</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">লো স্টক</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{lowStock.length}</div>
              </CardContent>
            </Card>
          </div>

          <InventoryForms
            items={items.map((i) => ({
              id: i.id,
              name: i.nameBn || i.name,
              quantity: i.quantity,
              unit: i.unit,
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle>স্টক তালিকা</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো আইটেম নেই</p>
              ) : (
                items.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{i.nameBn || i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.category || "—"} · {i.location || "—"} · ৳{i.unitCost}/{i.unit}
                      </p>
                    </div>
                    <Badge variant={i.quantity <= i.minStock ? "warning" : "success"}>
                      {i.quantity} {i.unit}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
