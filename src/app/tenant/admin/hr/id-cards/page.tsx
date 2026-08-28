import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";
import { PrintButton } from "./print-button";

export default async function StaffIdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ staffId?: string; roleType?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;

  let tenantName = "Institution";
  let tenantNameBn = "";
  let brand = "#059669";
  let staff: Awaited<ReturnType<typeof hrRepository.listStaff>> = [];

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
      staff = await hrRepository.listStaff({ status: "ACTIVE", take: 200 });
    } catch {
      /* db */
    }
  }

  let list = staff;
  if (sp.staffId) list = list.filter((s) => s.id === sp.staffId);
  if (sp.roleType) list = list.filter((s) => s.roleType === sp.roleType);

  const roles = [...new Set(staff.map((s) => s.roleType).filter(Boolean))];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">স্টাফ আইডি কার্ড</h1>
          <p className="text-sm text-muted-foreground">
            প্রিন্ট-রেডি · {list.length} কার্ড
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tenant/admin/hr" className="text-sm underline">
            HR ড্যাশবোর্ড
          </Link>
          <PrintButton />
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-2 print:hidden"
        action="/tenant/admin/hr/id-cards"
      >
        <select
          name="roleType"
          defaultValue={sp.roleType || ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">সব রোল</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          name="staffId"
          defaultValue={sp.staffId || ""}
          className="h-10 min-w-[200px] rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">সব স্টাফ</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameBn || s.name} ({s.employeeId})
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
        {list.map((s) => (
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
                <p className="truncate font-semibold">{s.nameBn || s.name}</p>
                {s.nameBn && s.name && s.nameBn !== s.name && (
                  <p className="truncate text-xs text-muted-foreground">{s.name}</p>
                )}
                <p className="mt-1 font-mono text-xs font-medium">{s.employeeId}</p>
                <p className="text-xs text-muted-foreground">{s.designation}</p>
                {s.department && (
                  <p className="text-xs text-muted-foreground">{s.department}</p>
                )}
                <p className="text-xs">{s.roleType}</p>
                {s.phone && (
                  <p className="truncate text-xs text-muted-foreground">{s.phone}</p>
                )}
              </div>
            </div>
            <div
              className="flex items-center justify-between border-t px-4 py-2 text-[10px]"
              style={{ borderColor: brand + "55" }}
            >
              <span className="font-mono tracking-wider">{s.employeeId}</span>
              <span className="text-muted-foreground">STAFF ID</span>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <EmptyState title="কোনো সক্রিয় স্টাফ নেই" />
      )}
    </div>
  );
}
