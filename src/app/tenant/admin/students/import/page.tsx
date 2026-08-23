import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BulkImportForm } from "./import-form";

export default async function StudentImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  if (session.user.tenantId) {
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
    } catch { /* */ }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        type="tenant"
        institutionName={tenantName}
        user={{
          name: session.user.name ?? "Admin",
          role: session.user.role,
          email: session.user.email ?? undefined,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="বাল্ক ইমপোর্ট"
          subtitle="CSV থেকে শিক্ষার্থী"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="space-y-6 p-6">
          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link href="/tenant/admin/students">← শিক্ষার্থী তালিকা</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CSV ফরম্যাট</CardTitle>
              <CardDescription>প্রথম সারি হেডার হতে হবে</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`name,name_bn,gender,student_id,father_name,father_phone,guardian_phone,is_hifz
Rahim Uddin,রহিম উদ্দিন,MALE,STU-2026-0101,Karim Uddin,01700000001,01700000002,YES
Fatima Begum,ফাতিমা বেগম,FEMALE,,Abdul Mia,01800000001,,NO`}
              </pre>
              <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                <li><code>name</code>, <code>gender</code> (MALE/FEMALE/OTHER) — বাধ্যতামূলক</li>
                <li><code>student_id</code> খালি থাকলে অটো জেনারেট</li>
                <li><code>is_hifz</code>: YES / NO</li>
                <li>ডুপ্লিকেট student_id স্কিপ হবে</li>
              </ul>
            </CardContent>
          </Card>

          <BulkImportForm />
        </div>
      </main>
    </div>
  );
}
