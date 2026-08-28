import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { AppHeader } from "@/components/layout/app-header";
import { PromoteForm } from "./promote-form";

export default async function PromotePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let classes: {
    id: string;
    name: string;
    nameBn: string | null;
    academicYearId: string;
    sections: { id: string; name: string }[];
  }[] = [];
  let students: {
    id: string;
    name: string;
    nameBn: string | null;
    studentId: string;
    currentClassId: string | null;
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

      classes = await prisma.class.findMany({
        where: { tenantId: session.user.tenantId, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          nameBn: true,
          academicYearId: true,
          sections: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
        },
      });

      const list = await studentRepository.list({ status: "ACTIVE", take: 500 });
      students = list.map((s) => ({
        id: s.id,
        name: s.name,
        nameBn: s.nameBn,
        studentId: s.studentId,
        currentClassId: s.currentClassId,
      }));
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="ব্যাচ প্রমোশন"
          subtitle="ক্লাস → পরবর্তী ক্লাস"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="page-pad">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/tenant/admin/students" className="underline">
              শিক্ষার্থী তালিকা
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/tenant/admin/students/id-cards" className="underline">
              আইডি কার্ড
            </Link>
          </div>

          {classes.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              প্রমোশনের জন্য অন্তত দুইটি ক্লাস লাগবে। আগে ক্লাস সেটআপ করুন।
            </p>
          ) : (
            <PromoteForm classes={classes} students={students} />
          )}
        </div>
      </main>
    </>
  );
}
