import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { createAssetAction } from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AssetsPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listAssets>> = [];
  try {
    rows = await extendedOpsRepository.listAssets();
  } catch {
    /* empty */
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">ফিক্সড অ্যাসেট</h1>
        <p className="text-sm text-muted-foreground">
          আসবাব · ল্যাব · আইটি · যানবাহন
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন অ্যাসেট · অ্যাসাইন SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAssetAction} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="নাম *"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="category"
              defaultValue="GENERAL"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="GENERAL">সাধারণ</option>
              <option value="FURNITURE">আসবাব</option>
              <option value="LAB">ল্যাব</option>
              <option value="IT">আইটি</option>
              <option value="VEHICLE">যানবাহন</option>
              <option value="OTHER">অন্যান্য</option>
            </select>
            <input
              name="assetTag"
              placeholder="ট্যাগ / কোড"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="location"
              placeholder="লোকেশন"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="purchaseValue"
              type="number"
              placeholder="ক্রয়মূল্য"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="condition"
              defaultValue="GOOD"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="GOOD">ভালো</option>
              <option value="FAIR">মোটামুটি</option>
              <option value="POOR">খারাপ</option>
              <option value="RETIRED">অবসর</option>
            </select>
            <input
              name="notes"
              placeholder="নোট"
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="assigneeName"
              placeholder="অ্যাসাইনি নাম"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="assigneePhone"
              placeholder="অ্যাসাইনি ফোন (SMS)"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="sendSms" defaultChecked />
              অ্যাসাইনি কে SMS
            </label>
            <Button type="submit">যোগ করুন</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[r.assetTag, r.location, r.purchaseValue != null ? `৳${r.purchaseValue}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{r.category}</Badge>
                <Badge>{r.condition}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
