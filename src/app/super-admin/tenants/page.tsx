import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { tenantRepository } from "@/infrastructure/database/repositories/tenant-repository";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  SUSPENDED: "destructive",
  CANCELLED: "secondary",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "সক্রিয়",
  TRIAL: "ট্রায়াল",
  SUSPENDED: "সাসপেন্ডেড",
  CANCELLED: "বাতিল",
};

export default async function TenantsPage() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/login");

  let tenants: Awaited<ReturnType<typeof tenantRepository.listAll>> = [];
  try {
    tenants = await tenantRepository.listAll();
  } catch {
    tenants = [];
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        type="super"
        user={{
          name: session.user.name ?? "Super Admin",
          role: session.user.role,
          email: session.user.email ?? undefined,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="প্রতিষ্ঠানসমূহ"
          subtitle="সব টেনান্ট ম্যানেজ করুন"
          userName={session.user.name ?? "Super Admin"}
          userRole={session.user.role}
          isSuperAdmin
        />

        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              মোট {tenants.length} টি প্রতিষ্ঠান
            </p>
            <Button asChild>
              <Link href="/super-admin/tenants/new">
                <Plus className="h-4 w-4" />
                নতুন প্রতিষ্ঠান
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                টেনান্ট তালিকা
              </CardTitle>
              <CardDescription>
                স্লাগ, প্ল্যান, স্ট্যাটাস ও শিক্ষার্থী সংখ্যা
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-12 text-center">
                  <p className="text-muted-foreground">এখনো কোনো প্রতিষ্ঠান নেই</p>
                  <Button className="mt-4" asChild>
                    <Link href="/super-admin/tenants/new">প্রথম প্রতিষ্ঠান তৈরি করুন</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenants.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.slug}.edupro.app · {t.plan} ·{" "}
                            {t._count.students} শিক্ষার্থী · {t._count.users} ইউজার
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusVariant[t.status] ?? "secondary"}>
                        {statusLabel[t.status] ?? t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
