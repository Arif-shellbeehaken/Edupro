import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function bdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function ParentFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;
  const sp = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  let children = await prisma.student.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      ...(user?.phone
        ? {
            OR: [
              { guardianPhone: user.phone },
              { fatherPhone: user.phone },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      nameBn: true,
      studentId: true,
      fatherName: true,
    },
    take: 20,
  });

  if (children.length === 0) {
    children = await prisma.student.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        nameBn: true,
        studentId: true,
        fatherName: true,
      },
      take: 6,
    });
  }

  const studentId = sp.studentId || children[0]?.id;
  const student = children.find((c) => c.id === studentId) || children[0];

  const invoices = student
    ? await prisma.invoice.findMany({
        where: { tenantId, studentId: student.id },
        orderBy: { issueDate: "desc" },
        include: { payments: true },
        take: 50,
      })
    : [];

  const billed = invoices.reduce((a, i) => a + i.totalAmount, 0);
  const paid = invoices.reduce((a, i) => a + i.paidAmount, 0);
  const due = billed - paid;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, nameBn: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-emerald-800">ফি পাসবুক</h1>
            <p className="text-xs text-muted-foreground">
              {tenant?.nameBn || tenant?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/parent">পোর্টাল</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              // client print via form would need client component; use simple link instruction
            >
              <span className="print:hidden">প্রিন্ট: Ctrl+P</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <form method="get" className="flex flex-wrap gap-2 print:hidden">
          <select
            name="studentId"
            defaultValue={student?.id || ""}
            className="h-10 min-w-[200px] rounded-md border bg-white px-3 text-sm"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameBn || c.name} ({c.studentId})
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline">
            দেখুন
          </Button>
        </form>

        {student && (
          <div className="rounded-lg border bg-white p-6">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
              {tenant?.nameBn || tenant?.name}
            </p>
            <h2 className="mt-1 text-center text-xl font-medium">Fee Statement</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p>
                নাম: <strong>{student.nameBn || student.name}</strong>
              </p>
              <p>
                আইডি: <strong className="tabular-nums">{student.studentId}</strong>
              </p>
              <p>পিতা: {student.fatherName || "—"}</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded border p-2">
                <p className="text-xs text-muted-foreground">বিল</p>
                <p className="font-semibold">{bdt(billed)}</p>
              </div>
              <div className="rounded border p-2">
                <p className="text-xs text-muted-foreground">আদায়</p>
                <p className="font-semibold">{bdt(paid)}</p>
              </div>
              <div className="rounded border p-2">
                <p className="text-xs text-muted-foreground">বকেয়া</p>
                <p className="font-semibold">{bdt(due)}</p>
              </div>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2">চালান</th>
                  <th className="py-2">তারিখ</th>
                  <th className="py-2">মোট</th>
                  <th className="py-2">পরিশোধ</th>
                  <th className="py-2">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-2 text-xs">
                      {new Date(inv.issueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2 tabular-nums">{bdt(inv.totalAmount)}</td>
                    <td className="py-2 tabular-nums">{bdt(inv.paidAmount)}</td>
                    <td className="py-2">
                      <Badge variant={inv.status === "PAID" ? "success" : "secondary"}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
