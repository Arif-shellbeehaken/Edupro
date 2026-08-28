import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { academicRepository } from "@/infrastructure/database/repositories/academic-repository";
import { AppHeader } from "@/components/layout/app-header";
import { RolloverForms } from "./rollover-forms";

export default async function AcademicRolloverPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let years: {
    id: string;
    name: string;
    nameBn: string | null;
    isCurrent: boolean;
    startDate: string;
    endDate: string;
    classCount: number;
    studentCount: number;
  }[] = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (tenant) tenantName = tenant.nameBn || tenant.name;

      const rows = await academicRepository.listYears();
      years = rows.map((y) => ({
        id: y.id,
        name: y.name,
        nameBn: y.nameBn,
        isCurrent: y.isCurrent,
        startDate: y.startDate.toISOString().slice(0, 10),
        endDate: y.endDate.toISOString().slice(0, 10),
        classCount: y._count.classes,
        studentCount: y._count.students,
      }));
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="একাডেমিক রোলওভার"
          subtitle="সেশন · ক্লাস ক্লোন · শিক্ষার্থী মাইগ্রেশন"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="page-pad">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/tenant/admin/students/promote" className="underline">
              ব্যাচ প্রমোশন
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/tenant/admin/settings" className="underline">
              সেটিংস
            </Link>
          </div>
          <RolloverForms years={years} />
        </div>
      </main>
    </>
  );
}
