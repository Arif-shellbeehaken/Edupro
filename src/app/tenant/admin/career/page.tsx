import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import {
  createJobAction,
  toggleJobActiveAction,
} from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CareerPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listJobs>> = [];
  try {
    rows = await extendedOpsRepository.listJobs();
  } catch {
    /* empty */
  }

  return (
    <div className="page-pad">
      <div>
        <h1 className="text-2xl font-semibold">ক্যারিয়ার ও জব বোর্ড</h1>
        <p className="text-sm text-muted-foreground">
          অ্যালামনাই · ইন্টার্নশিপ · প্লেসমেন্ট
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন পোস্টিং · অ্যালামনাই SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createJobAction} className="grid gap-3 sm:grid-cols-2">
            <input
              name="title"
              required
              placeholder="পদ *"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="company"
              placeholder="প্রতিষ্ঠান"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              name="location"
              placeholder="লোকেশন"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="jobType"
              defaultValue="FULL_TIME"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="FULL_TIME">ফুল টাইম</option>
              <option value="PART_TIME">পার্ট টাইম</option>
              <option value="INTERNSHIP">ইন্টার্নশিপ</option>
            </select>
            <input
              name="applyUrl"
              placeholder="আবেদন লিংক"
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              placeholder="বিবরণ"
              rows={3}
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="sendSms" defaultChecked />
              অ্যালামনাই/অভিভাবককে bulk SMS
            </label>
            <Button type="submit">পোস্ট করুন</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{r.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.jobType}</Badge>
                  <Badge variant={r.isActive ? "success" : "outline"}>
                    {r.isActive ? "সক্রিয়" : "বন্ধ"}
                  </Badge>
                  <form action={toggleJobActiveAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="active" value={r.isActive ? "false" : "true"} />
                    <Button type="submit" size="sm" variant="outline">
                      {r.isActive ? "বন্ধ করুন" : "সক্রিয়"}
                    </Button>
                  </form>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {[r.company, r.location].filter(Boolean).join(" · ")}
              </p>
              {r.description && (
                <p className="mt-2 text-sm whitespace-pre-wrap">{r.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
