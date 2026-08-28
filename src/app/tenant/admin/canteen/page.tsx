import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import {
  createCanteenItemAction,
  createCanteenSaleAction,
  sellCanteenItemAction,
  toggleCanteenItemAction,
} from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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
  let items: Awaited<ReturnType<typeof extendedOpsRepository.listCanteenItems>> =
    [];
  let sales: Awaited<ReturnType<typeof extendedOpsRepository.listCanteenSales>> =
    [];
  try {
    items = await extendedOpsRepository.listCanteenItems();
    sales = await extendedOpsRepository.listCanteenSales();
  } catch {
    /* empty */
  }
  const todayTotal = sales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="page-pad">
      <div>
        <h1 className="page-title">ক্যান্টিন / মেস POS</h1>
        <p className="text-sm text-muted-foreground">
          মেনু · POS বিক্রি · নগদ/কার্ড · মোট {bdt(todayTotal)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>মেনু আইটেম</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={createCanteenItemAction}
              className="mb-4 grid gap-2 sm:grid-cols-2"
            >
              <input
                name="name"
                required
                placeholder="Name *"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="nameBn"
                placeholder="বাংলা নাম"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="price"
                type="number"
                required
                placeholder="মূল্য (৳)"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                name="category"
                defaultValue="MEAL"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="MEAL">খাবার</option>
                <option value="SNACK">স্ন্যাকস</option>
                <option value="DRINK">পানীয়</option>
                <option value="OTHER">অন্যান্য</option>
              </select>
              <Button type="submit" className="sm:col-span-2">
                যোগ
              </Button>
            </form>
            <div className="space-y-2">
              {items.length === 0 ? (
                <EmptyState title="মেনু খালি" description="প্রথম আইটেম যোগ করুন" />
              ) : (
                items.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{it.nameBn || it.name}</span>
                      <Badge
                        variant={it.isAvailable ? "success" : "outline"}
                        className="ml-2"
                      >
                        {it.isAvailable ? "উপলব্ধ" : "বন্ধ"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-medium">
                        {bdt(it.price)}
                      </span>
                      <form action={toggleCanteenItemAction}>
                        <input type="hidden" name="id" value={it.id} />
                        <input
                          type="hidden"
                          name="available"
                          value={it.isAvailable ? "false" : "true"}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          {it.isAvailable ? "বন্ধ" : "খুলুন"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>POS বিক্রি · লগ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={sellCanteenItemAction}
              className="grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 sm:grid-cols-2 dark:border-emerald-900 dark:bg-emerald-950/20"
            >
              <select
                name="itemId"
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              >
                <option value="">মেনু থেকে আইটেম *</option>
                {items
                  .filter((i) => i.isAvailable)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameBn || i.name} — {bdt(i.price)}
                    </option>
                  ))}
              </select>
              <input
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                name="paidVia"
                defaultValue="CASH"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="CASH">নগদ</option>
                <option value="CARD">কার্ড</option>
                <option value="ACCOUNT">হিসাব</option>
              </select>
              <input
                name="studentId"
                placeholder="Student id (ঐচ্ছিক)"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              />
              <Button type="submit" className="sm:col-span-2">
                POS বিক্রি
              </Button>
            </form>

            <form
              action={createCanteenSaleAction}
              className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2"
            >
              <p className="text-xs text-muted-foreground sm:col-span-2">
                ম্যানুয়াল এন্ট্রি (মেনুতে না থাকলে)
              </p>
              <input
                name="itemName"
                required
                placeholder="আইটেম *"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="unitPrice"
                type="number"
                required
                placeholder="একক মূল্য"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="quantity"
                type="number"
                defaultValue={1}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                name="paidVia"
                defaultValue="CASH"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="CASH">নগদ</option>
                <option value="CARD">কার্ড</option>
                <option value="WALLET">ওয়ালেট</option>
              </select>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="sendSms" />
                অভিভাবক SMS (studentId থাকলে)
              </label>
              <input
                name="studentId"
                placeholder="শিক্ষার্থী ID"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
              />
              <Button type="submit" variant="outline" className="sm:col-span-2">
                ম্যানুয়াল সেভ
              </Button>
            </form>

            <div className="space-y-2 border-t border-border pt-4">
              {sales.length === 0 ? (
                <EmptyState title="কোনো বিক্রি নেই" />
              ) : (
                sales.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {s.itemName} × {s.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.soldAt).toLocaleString("bn-BD")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{s.paidVia}</Badge>
                      <span className="tabular-nums font-medium">
                        {bdt(s.total)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
