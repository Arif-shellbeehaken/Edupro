import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { financeRepository } from "@/infrastructure/database/repositories/finance-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "./print-button";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function FeePassbookPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;

  let tenantName = "প্রতিষ্ঠান";
  let tenantNameBn = "";
  let students: Awaited<ReturnType<typeof studentRepository.list>> = [];
  let invoices: Awaited<ReturnType<typeof financeRepository.listInvoices>> = [];

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
      if (tenant) {
        tenantName = tenant.name;
        tenantNameBn = tenant.nameBn || "";
      }
      students = await studentRepository.list({ take: 200 });
      invoices = await financeRepository.listInvoices({
        studentId: sp.studentId || undefined,
        take: 100,
      });
    } catch {
      /* db */
    }
  }

  const student = sp.studentId
    ? students.find((s) => s.id === sp.studentId)
    : null;

  const filtered = student
    ? invoices.filter((i) => i.studentId === student.id)
    : invoices;

  const billed = filtered.reduce((a, i) => a + i.totalAmount, 0);
  const paid = filtered.reduce((a, i) => a + i.paidAmount, 0);
  const due = billed - paid;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">ফি পাসবুক / সেটেলমেন্ট</h1>
          <p className="text-sm text-muted-foreground">
            শিক্ষার্থীভিত্তিক চালান ও আদায়ের হিসাব
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tenant/admin/finance" className="text-sm underline">
            ফি মডিউল
          </Link>
          <PrintButton />
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-2 print:hidden"
        action="/tenant/admin/finance/passbook"
      >
        <select
          name="studentId"
          defaultValue={sp.studentId || ""}
          className="h-10 min-w-[220px] rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">সব শিক্ষার্থী</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameBn || s.name} ({s.studentId})
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          দেখুন
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-card p-6 print:border-black">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          {tenantNameBn || tenantName}
        </p>
        <h2 className="mt-1 text-center text-xl font-medium">Fee Passbook</h2>
        <p className="text-center text-sm text-muted-foreground">
          ফি সেটেলমেন্ট স্টেটমেন্ট
        </p>

        {student && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <p>
              নাম:{" "}
              <span className="font-medium">{student.nameBn || student.name}</span>
            </p>
            <p>
              আইডি:{" "}
              <span className="font-medium tabular-nums">{student.studentId}</span>
            </p>
            <p>পিতা: {student.fatherName || "—"}</p>
            <p>ফোন: {student.fatherPhone || student.guardianPhone || "—"}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">বিল</p>
            <p className="font-semibold tabular-nums">{bdt(billed)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">আদায়</p>
            <p className="font-semibold tabular-nums">{bdt(paid)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">বকেয়া</p>
            <p className="font-semibold tabular-nums">{bdt(due)}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2">চালান</th>
              {!student && <th className="py-2">শিক্ষার্থী</th>}
              <th className="py-2">তারিখ</th>
              <th className="py-2">মোট</th>
              <th className="py-2">পরিশোধ</th>
              <th className="py-2">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-muted-foreground">
                  কোনো চালান নেই
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-border/60">
                <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                {!student && (
                  <td className="py-2">
                    {inv.student?.nameBn || inv.student?.name || "—"}
                  </td>
                )}
                <td className="py-2 text-xs">
                  {new Date(inv.issueDate).toLocaleDateString("en-GB")}
                </td>
                <td className="py-2 tabular-nums">{bdt(inv.totalAmount)}</td>
                <td className="py-2 tabular-nums">{bdt(inv.paidAmount)}</td>
                <td className="py-2">
                  <Badge
                    variant={
                      inv.status === "PAID"
                        ? "success"
                        : inv.status === "OVERDUE"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {inv.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Generated {new Date().toLocaleString("en-GB")} · Edupro Fee Passbook
        </p>
      </div>
    </div>
  );
}
