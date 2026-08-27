import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { createVehicleLogAction } from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function VehiclesPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listVehicleLogs>> = [];
  try {
    rows = await extendedOpsRepository.listVehicleLogs();
  } catch {
    /* empty */
  }
  const spend = rows.reduce((a, r) => a + (r.amount ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">যানবাহন মেইনটেন্যান্স</h1>
        <p className="text-sm text-muted-foreground">
          সার্ভিস · জ্বালানি · মেরামত · মোট খরচ {bdt(spend)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন লগ · ড্রাইভার SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createVehicleLogAction} className="grid gap-3 sm:grid-cols-2">
            <input name="vehicleLabel" required placeholder="বাহন (বাস-১ / CNG-২) *" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <select name="logType" defaultValue="SERVICE" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="SERVICE">সার্ভিস</option>
              <option value="FUEL">জ্বালানি</option>
              <option value="REPAIR">মেরামত</option>
              <option value="INSPECTION">ইনস্পেকশন</option>
            </select>
            <input name="amount" type="number" placeholder="খরচ (৳)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="odometer" type="number" placeholder="ওডোমিটার (কিমি)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="notes" placeholder="নোট" className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input
              name="driverPhone"
              placeholder="ড্রাইভার ফোন (SMS)"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="sendSms" defaultChecked />
              ড্রাইভারকে SMS
            </label>
            <Button type="submit">সেভ</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{r.vehicleLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.serviceDate).toLocaleDateString("en-GB")}
                  {r.odometer != null ? ` · ${r.odometer} km` : ""}
                  {r.notes ? ` · ${r.notes}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{r.logType}</Badge>
                {r.amount != null && (
                  <span className="tabular-nums text-sm font-medium">{bdt(r.amount)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
