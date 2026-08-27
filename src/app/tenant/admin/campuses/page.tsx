import { CampusDigestForm } from "./digest-form";
import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import { createCampusAction, setActiveCampusAction } from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CampusesPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listCampuses>> = [];
  try {
    rows = await extendedOpsRepository.listCampuses();
  } catch {
    /* empty */
  }

  return (
    <div className="space-y-6 p-6">
      <CampusDigestForm />
      <div>
        <h1 className="text-2xl font-semibold">মাল্টি-ক্যাম্পাস / শাখা</h1>
        <p className="text-sm text-muted-foreground">
          শাখা সুইচ · অডিট লগ · SMS নোটিফিকেশন
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন শাখা</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCampusAction} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="নাম (EN) *"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="nameBn"
              placeholder="বাংলা নাম"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="code"
              placeholder="কোড (MAIN / CTG)"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="ফোন"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="address"
              placeholder="ঠিকানা"
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isMain" /> মূল ক্যাম্পাস
            </label>
            <Button type="submit">শাখা যোগ</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{r.nameBn || r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[r.code, r.address, r.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.isMain && <Badge>মূল</Badge>}
                <form action={setActiveCampusAction}>
                  <input type="hidden" name="campusId" value={r.id} />
                  <Button type="submit" size="sm" variant="outline">
                    সক্রিয় · অডিট/SMS
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
