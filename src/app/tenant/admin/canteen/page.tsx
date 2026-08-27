import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import {
  createCanteenItemAction,
  createCanteenSaleAction,
} from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function CanteenPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let items: Awaited<ReturnType<typeof extendedOpsRepository.listCanteenItems>> = [];
  let sales: Awaited<ReturnType<typeof extendedOpsRepository.listCanteenSales>> = [];
  try {
    items = await extendedOpsRepository.listCanteenItems();
    sales = await extendedOpsRepository.listCanteenSales();
  } catch {
    /* empty */
  }
  const todayTotal = sales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">ক্যান্টিন / মেস POS</h1>
        <p className="text-sm text-muted-foreground">
          মেনু · বিক্রি · নগদ/কার্ড · মোট {bdt(todayTotal)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>মেনু আইটেম</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCanteenItemAction} className="mb-4 grid gap-2 sm:grid-cols-2">
              <input name="name" required placeholder="Name *" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="nameBn" placeholder="বাংলা নাম" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="price" type="number" required placeholder="মূল্য (৳)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <select name="category" defaultValue="MEAL" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="MEAL">খাবার</option>
                <option value="SNACK">স্ন্যাকস</option>
                <option value="DRINK">পানীয়</option>
                <option value="OTHER">অন্যান্য</option>
              </select>
              <Button type="submit">যোগ</Button>
            </form>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{it.nameBn || it.name}</span>
                  <span className="tabular-nums font-medium">{bdt(it.price)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>বিক্রি রেকর্ড · অভিভাবক SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCanteenSaleAction} className="mb-4 grid gap-2 sm:grid-cols-2">
              <input name="itemName" required placeholder="আইটেম *" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="unitPrice" type="number" required placeholder="একক মূল্য" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="quantity" type="number" defaultValue={1} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <select name="paidVia" defaultValue="CASH" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="CASH">নগদ</option>
                <option value="CARD">কার্ড</option>
                <option value="WALLET">ওয়ালেট</option>
              </select>
              <input name="studentId" placeholder="শিক্ষার্থী ID (ঐচ্ছিক)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="sendSms" />
                অভিভাবককে SMS (studentId থাকলে)
              </label>
              <Button type="submit" className="sm:col-span-2">বিক্রি সেভ</Button>
            </form>
            <div className="space-y-2">
              {sales.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{s.itemName} × {s.quantity}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.soldAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{s.paidVia}</Badge>
                    <span className="tabular-nums font-medium">{bdt(s.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
