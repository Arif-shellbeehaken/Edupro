import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TenantSystemPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.tenantId) redirect("/login");

  setTenantContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isSuperAdmin: false,
  });

  let dbOk = false;
  let counts = { students: 0, staff: 0, invoices: 0, messages: 0 };

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    const tid = session.user.tenantId;
    const [students, staff, invoices, messages] = await Promise.all([
      prisma.student.count({
        where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.staff.count({
        where: { tenantId: tid, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.invoice.count({ where: { tenantId: tid } }),
      prisma.messageLog.count({ where: { tenantId: tid } }),
    ]);
    counts = { students, staff, invoices, messages };
  } catch {
    dbOk = false;
  }

  return (
    <div className="page-pad">
      <div>
        <h1 className="text-2xl font-semibold">সিস্টেম স্ট্যাটাস</h1>
        <p className="text-sm text-muted-foreground">
          প্রোডাকশন রেডিনেস · DB · মডিউল কাউন্ট
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={dbOk ? "success" : "destructive"}>
              {dbOk ? "UP" : "DOWN"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">শিক্ষার্থী</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {counts.students}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">স্টাফ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {counts.staff}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SMS লগ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {counts.messages}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">চেকলিস্ট</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <a
              href="/tenant/admin/system/backup"
              className="font-medium text-emerald-700 underline"
            >
              টেনান্ট ব্যাকআপ JSON ডাউনলোড
            </a>
          </p>
          <p>
            · Health: <code>/api/health</code>
          </p>
          <p>· BANBEIS/EMIS: Reports → CSV</p>
          <p>· SMS: docs/SMS_CATALOG.md</p>
          <p>· Deploy: docs/PRODUCTION.md</p>
        </CardContent>
      </Card>
    </div>
  );
}
