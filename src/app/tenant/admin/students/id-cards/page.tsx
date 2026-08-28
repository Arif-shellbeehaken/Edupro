import { EmptyState } from "@/components/ui/empty-state";
import { IdCardNotifyForm } from "./notify-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { PrintButton } from "./print-button";

export default async function StudentIdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; classFilter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;

  let tenantName = "Institution";
  let tenantNameBn = "";
  let students: Awaited<ReturnType<typeof studentRepository.list>> = [];
  let brand = "#059669";

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
        select: {
          name: true,
          nameBn: true,
          primaryColor: true,
          address: true,
          phone: true,
        },
      });
      if (tenant) {
        tenantName = tenant.name;
        tenantNameBn = tenant.nameBn || "";
        if (tenant.primaryColor) brand = tenant.primaryColor;
      }
      students = await studentRepository.list({ status: "ACTIVE", take: 200 });
    } catch {
      /* db */
    }
  }

  const classes = [
    ...new Set(
      students
        .map((s) => s.currentClass?.nameBn || s.currentClass?.name || "")
        .filter(Boolean)
    ),
  ];

  let list = students;
  if (sp.studentId) list = list.filter((s) => s.id === sp.studentId);
  if (sp.classFilter)
    list = list.filter(
      (s) =>
        (s.currentClass?.nameBn || s.currentClass?.name || "") === sp.classFilter
    );

  return (
    <div className="mx-auto max-w-5xl page-pad">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="page-title">স্টুডেন্ট আইডি কার্ড</h1>
          <p className="text-sm text-muted-foreground">
            প্রিন্ট-রেডি · QR-ready code · {list.length} কার্ড
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <IdCardNotifyForm
            classes={
              Array.from(
                new Map(
                  students
                    .filter((s) => s.currentClassId && s.currentClass)
                    .map((s) => [
                      s.currentClassId!,
                      {
                        id: s.currentClassId!,
                        name: s.currentClass?.nameBn || s.currentClass?.name || "",
                      },
                    ])
                ).values()
              )
            }
          />
          <Link href="/tenant/admin/students" className="text-sm underline">
            শিক্ষার্থী তালিকা
          </Link>
          <PrintButton />
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-2 print:hidden"
        action="/tenant/admin/students/id-cards"
      >
        <select
          name="classFilter"
          defaultValue={sp.classFilter || ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">সব ক্লাস</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="studentId"
          defaultValue={sp.studentId || ""}
          className="h-10 min-w-[200px] rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">সব শিক্ষার্থী</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameBn || s.name} ({s.studentId})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md border border-border bg-card px-4 text-sm"
        >
          ফিল্টার
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        {list.map((s) => {
          const cls =
            s.currentClass?.nameBn || s.currentClass?.name || "—";
          const code = s.studentId;
          return (
            <div
              key={s.id}
              className="break-inside-avoid overflow-hidden rounded-xl border-2 bg-white shadow-sm print:shadow-none"
              style={{ borderColor: brand }}
            >
              <div
                className="px-4 py-2 text-center text-white"
                style={{ backgroundColor: brand }}
              >
                <p className="text-sm font-semibold leading-tight">
                  {tenantNameBn || tenantName}
                </p>
                {tenantNameBn && (
                  <p className="text-[10px] opacity-90">{tenantName}</p>
                )}
              </div>
              <div className="flex gap-3 p-4">
                <div
                  className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md border text-xs text-muted-foreground"
                  style={{ borderColor: brand }}
                >
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photoUrl}
                      alt=""
                      className="h-full w-full rounded-md object-cover"
                    />
                  ) : (
                    <span>PHOTO</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">
                    {s.nameBn || s.name}
                  </p>
                  {s.nameBn && s.name && s.nameBn !== s.name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {s.name}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs font-medium">{code}</p>
                  <p className="text-xs text-muted-foreground">Class: {cls}</p>
                  {s.bloodGroup && (
                    <p className="text-xs">Blood: {s.bloodGroup}</p>
                  )}
                  {(s.fatherName || s.fatherPhone) && (
                    <p className="truncate text-xs text-muted-foreground">
                      Guardian: {s.fatherName || s.fatherPhone}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="flex items-center justify-between border-t px-4 py-2 text-[10px]"
                style={{ borderColor: brand + "55" }}
              >
                <span className="font-mono tracking-wider">{code}</span>
                <span className="text-muted-foreground">STUDENT ID</span>
              </div>
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <EmptyState title="কোনো শিক্ষার্থী নেই" />
      )}
    </div>
  );
}
