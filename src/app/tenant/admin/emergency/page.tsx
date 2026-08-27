import { auth } from "@/infrastructure/auth/auth";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { extendedOpsRepository } from "@/infrastructure/database/repositories/extended-ops-repository";
import {
  createEmergencyAction,
  resolveEmergencyAction,
  scheduleEmergencyDrillAction,
} from "@/application/use-cases/extended/extended-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EmergencyPage() {
  const session = await auth();
  if (session?.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: !!session.user.isSuperAdmin,
    });
  }
  let rows: Awaited<ReturnType<typeof extendedOpsRepository.listEmergencies>> = [];
  try {
    rows = await extendedOpsRepository.listEmergencies();
  } catch {
    /* empty */
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">ইমার্জেন্সি অ্যালার্ট</h1>
        <p className="text-sm text-muted-foreground">
          ক্যাম্পাস ব্রডকাস্ট · স্টাফ / অভিভাবক / সবাই
        </p>
      </div>

      
      <Card>
        <CardHeader>
          <CardTitle>ইমার্জেন্সি ড্রিল শিডিউল · SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={scheduleEmergencyDrillAction} className="grid gap-2 sm:grid-cols-2">
            <input
              name="title"
              required
              placeholder="ড্রিল শিরোনাম *"
              className="flex h-10 rounded-md border px-3 text-sm"
              defaultValue="অগ্নি নির্বাপণ ড্রিল"
            />
            <input
              name="drillAt"
              type="datetime-local"
              required
              className="flex h-10 rounded-md border px-3 text-sm"
            />
            <select name="audience" className="flex h-10 rounded-md border px-3 text-sm" defaultValue="ALL">
              <option value="ALL">সবাই</option>
              <option value="STAFF">স্টাফ</option>
              <option value="PARENTS">অভিভাবক</option>
            </select>
            <input
              name="message"
              placeholder="নির্দেশনা"
              className="flex h-10 rounded-md border px-3 text-sm"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="sendSMS" defaultChecked />
              অডিয়েন্সকে SMS
            </label>
            <Button type="submit" className="sm:col-span-2">
              ড্রিল শিডিউল
            </Button>
          </form>
        </CardContent>
      </Card>
<Card>
        <CardHeader>
          <CardTitle>নতুন অ্যালার্ট</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEmergencyAction} className="grid gap-3 sm:grid-cols-2">
            <input
              name="title"
              required
              placeholder="শিরোনাম *"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="severity"
              defaultValue="HIGH"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="LOW">কম</option>
              <option value="MEDIUM">মাঝারি</option>
              <option value="HIGH">উচ্চ</option>
              <option value="CRITICAL">জরুরি</option>
            </select>
            <select
              name="audience"
              defaultValue="ALL"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">সবাই</option>
              <option value="STAFF">স্টাফ</option>
              <option value="PARENTS">অভিভাবক</option>
              <option value="STUDENTS">শিক্ষার্থী</option>
            </select>
            <textarea
              name="message"
              required
              placeholder="বার্তা *"
              rows={3}
              className="sm:col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="sendSms" defaultChecked />
              অডিয়েন্সকে bulk SMS পাঠান
            </label>
            <Button type="submit">ব্রডকাস্ট</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">কোনো অ্যালার্ট নেই</p>
        )}
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {r.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {r.audience} · {new Date(r.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "ACTIVE" ? "destructive" : "secondary"}>
                  {r.severity} · {r.status}
                </Badge>
                {r.status === "ACTIVE" && (
                  <form
                    action={async () => {
                      "use server";
                      await resolveEmergencyAction(r.id);
                    }}
                  >
                    <Button type="submit" size="sm" variant="outline">
                      সমাধান
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
