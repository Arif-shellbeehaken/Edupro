import Link from "next/link";
import { prisma } from "@/infrastructure/database/prisma";
import { requireParentSession } from "@/application/use-cases/portal/parent-session";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const session = await requireParentSession();
  const sp = await searchParams;
  const studentId = sp.studentId;

  const children = await prisma.student.findMany({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { guardianPhone: session.phone },
        { fatherPhone: session.phone },
      ],
    },
    select: {
      id: true,
      name: true,
      nameBn: true,
      studentId: true,
    },
    take: 20,
  });

  const activeId =
    studentId && children.some((c) => c.id === studentId)
      ? studentId
      : children[0]?.id;

  const student = activeId
    ? await prisma.student.findFirst({
        where: { id: activeId, tenantId: session.tenantId },
        include: {
          invoices: {
            orderBy: { issueDate: "desc" },
            take: 40,
          },
        },
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-background">
      <div className="mx-auto max-w-3xl space-y-4 p-4 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-emerald-900">ফি পাসবুক</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent">← পোর্টাল</Link>
          </Button>
        </div>

        {children.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/parent/fees?studentId=${c.id}`}
                className={`rounded-full border px-3 py-1 text-xs ${
                  c.id === activeId
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "hover:bg-muted"
                }`}
              >
                {c.nameBn || c.name}
              </Link>
            ))}
          </div>
        )}

        {!student ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              শিক্ষার্থী পাওয়া যায়নি
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {student.nameBn || student.name}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({student.studentId})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {student.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো চালান নেই</p>
              ) : (
                student.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.issueDate.toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <span className="font-semibold">{bdt(inv.totalAmount)}</span>
                    <Badge
                      variant={inv.status === "PAID" ? "success" : "warning"}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
