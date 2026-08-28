import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DropoutForm } from "./form";

export default async function DropoutPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const flags = await prisma.studentRiskFlag.findMany({
    where: { tenantId: session.user.tenantId, resolvedAt: null },
    orderBy: { riskScore: "desc" },
    take: 50,
  });
  const students = await prisma.student.findMany({
    where: {
      id: { in: flags.map((f) => f.studentId) },
    },
    select: { id: true, name: true, studentId: true },
  });
  const nameMap = Object.fromEntries(
    students.map((s) => [s.id, s.name + " (" + s.studentId + ")"])
  );

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <AppHeader
        title="ঝরে পড়ার ঝুঁকি"
        subtitle="Absence + fee heuristic"
        userName={session.user.name ?? "Admin"}
        userRole={session.user.role}
      />
      <div className="page-pad">
        <DropoutForm />
        <Card>
          <CardHeader>
            <CardTitle>ফ্ল্যাগড শিক্ষার্থী</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flags.length === 0 ? (
              <EmptyState title="ঝুঁকি ফ্ল্যাগ নেই" description="হিউরিস্টিক চালিয়ে ফ্ল্যাগ তৈরি করুন" />
            ) : (
              flags.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {nameMap[f.studentId] || f.studentId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.reasonsJson
                        ? JSON.parse(f.reasonsJson).join(" · ")
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={f.riskScore >= 60 ? "destructive" : "warning"}
                  >
                    {Math.round(f.riskScore)}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
