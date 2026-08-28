import { PrintQueueForm } from "./print-queue-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { setTenantContext } from "@/infrastructure/tenancy/tenant-context";
import { certificateRepository } from "@/infrastructure/database/repositories/certificate-repository";
import { studentRepository } from "@/infrastructure/database/repositories/student-repository";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CertificateForms } from "./certificate-forms";


const TYPE_LABEL: Record<string, string> = {
  TRANSFER: "ট্রান্সফার",
  CHARACTER: "চারিত্রিক",
  TESTIMONIAL: "টেস্টিমোনিয়াল",
  HIFZ_COMPLETION: "হিফজ সমাপনী",
  BIRTH: "জন্ম সনদ",
  OTHER: "অন্যান্য",
};

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let certs: Awaited<ReturnType<typeof certificateRepository.list>> = [];
  let students: { id: string; name: string; studentId: string }[] = [];

  if (session.user.tenantId) {
    setTenantContext({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
      isSuperAdmin: false,
    });
    try {
      const t = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (t) tenantName = t.nameBn || t.name;
      certs = await certificateRepository.list();
      const s = await studentRepository.list({ status: "ACTIVE", take: 100 });
      students = s.map((x) => ({
        id: x.id,
        name: x.nameBn || x.name,
        studentId: x.studentId,
      }));
    } catch {
      /* db */
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="সার্টিফিকেট"
          subtitle="ট্রান্সফার · চারিত্রিক · হিফজ সমাপনী"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />
        <div className="page-pad">
          <PrintQueueForm certs={certs.map((c) => ({ id: c.id, certificateNo: c.certificateNo, studentName: c.studentName, certType: c.certType }))} />
          <CertificateForms students={students} />

          <Card>
            <CardHeader>
              <CardTitle>ইস্যুকৃত সার্টিফিকেট</CardTitle>
              <CardDescription>{certs.length} টি রেকর্ড</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {certs.length === 0 ? (
                <EmptyState title="কোনো সার্টিফিকেট নেই" description="মার্কশিট/টিসি ইস্যু করুন" />
              ) : (
                certs.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {c.studentNameBn || c.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.certificateNo} · {TYPE_LABEL[c.certType] ?? c.certType}
                        {c.className ? ` · ${c.className}` : ""} ·{" "}
                        {c.issueDate.toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "ISSUED" ? "success" : "secondary"}>
                        {c.status === "ISSUED" ? "ইস্যু" : "বাতিল"}
                      </Badge>
                      {c.status === "ISSUED" && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/tenant/admin/certificates/${c.id}/print`}>
                            প্রিন্ট
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
