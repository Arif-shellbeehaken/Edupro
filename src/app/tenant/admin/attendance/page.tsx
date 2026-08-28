import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { attendanceRepository } from "@/infrastructure/database/repositories/attendance-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttendanceForm } from "./attendance-form";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let students: Awaited<ReturnType<typeof studentRepository.list>> = [];
  let summary: Record<string, number> = {};
  const today = new Date();
  today.setHours(12, 0, 0, 0);

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
      students = await studentRepository.list({ status: "ACTIVE", take: 80 });
      summary = await attendanceRepository.summaryForDate(today);
    } catch {
      students = [];
    }
  }

  const present = summary.PRESENT ?? 0;
  const absent = summary.ABSENT ?? 0;
  const late = summary.LATE ?? 0;
  const totalMarked = present + absent + late + (summary.LEAVE ?? 0) + (summary.HALF_DAY ?? 0);

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="উপস্থিতি"
          subtitle={today.toLocaleDateString("bn-BD", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="page-pad">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">মার্ক করা</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMarked}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">উপস্থিত</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{present}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">অনুপস্থিত</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{absent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">লেট</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{late}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                আজকের উপস্থিতি মার্ক করুন
              </CardTitle>
              <CardDescription>
                প্রতিটি শিক্ষার্থীর জন্য স্ট্যাটাস সিলেক্ট করে সংরক্ষণ করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  কোনো শিক্ষার্থী নেই। আগে SIS থেকে শিক্ষার্থী যোগ করুন।
                </p>
              ) : (
                <AttendanceForm
                  students={students.map((s) => ({
                    id: s.id,
                    name: s.nameBn || s.name,
                    studentId: s.studentId,
                  }))}
                  defaultDate={today.toISOString().slice(0, 10)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
