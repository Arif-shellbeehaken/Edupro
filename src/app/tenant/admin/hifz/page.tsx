import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Plus, Search } from "lucide-react";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


const demoHifzStudents = [
  {
    id: "1",
    name: "আব্দুল্লাহ ইবনে মাসউদ",
    studentId: "2025-HIFZ-0012",
    currentJuz: 12,
    currentPage: 218,
    sabakToday: true,
    quality: "GOOD",
    totalJuz: 11,
  },
  {
    id: "2",
    name: "মুহাম্মদ ইউসুফ",
    studentId: "2025-HIFZ-0008",
    currentJuz: 5,
    currentPage: 92,
    sabakToday: false,
    quality: "EXCELLENT",
    totalJuz: 4,
  },
  {
    id: "3",
    name: "আবু বকর সিদ্দীক",
    studentId: "2025-HIFZ-0021",
    currentJuz: 18,
    currentPage: 340,
    sabakToday: true,
    quality: "AVERAGE",
    totalJuz: 17,
  },
  {
    id: "4",
    name: "উমর ইবনুল খাত্তাব",
    studentId: "2025-HIFZ-0003",
    currentJuz: 27,
    currentPage: 510,
    sabakToday: true,
    quality: "GOOD",
    totalJuz: 26,
  },
];

const qualityLabel: Record<string, { label: string; variant: "success" | "warning" | "default" | "secondary" }> = {
  EXCELLENT: { label: "উৎকৃষ্ট", variant: "success" },
  GOOD: { label: "ভালো", variant: "success" },
  AVERAGE: { label: "মোটামুটি", variant: "warning" },
  NEEDS_WORK: { label: "উন্নতি দরকার", variant: "warning" },
  WEAK: { label: "দুর্বল", variant: "default" },
};

export default async function HifzPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let tenantName = "প্রতিষ্ঠান";
  let students = demoHifzStudents;

  if (session.user.tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, nameBn: true },
      });
      if (tenant) tenantName = tenant.nameBn || tenant.name;

      const dbStudents = await prisma.student.findMany({
        where: {
          tenantId: session.user.tenantId,
          isHifzStudent: true,
          deletedAt: null,
          status: "ACTIVE",
        },
        include: { hifzProgress: true },
        orderBy: { name: "asc" },
        take: 50,
      });

      if (dbStudents.length > 0) {
        students = dbStudents.map((s) => ({
          id: s.id,
          name: s.nameBn || s.name,
          studentId: s.studentId,
          currentJuz: s.hifzProgress?.currentJuz ?? s.currentJuz ?? 1,
          currentPage: s.hifzProgress?.currentPage ?? s.currentPage ?? 1,
          sabakToday:
            s.hifzProgress?.lastEntryDate != null &&
            new Date(s.hifzProgress.lastEntryDate).toDateString() ===
              new Date().toDateString(),
          quality: "GOOD",
          totalJuz: s.hifzProgress?.totalJuzCompleted ?? 0,
        }));
      }
    } catch {
      tenantName = "দারুল উলূম মাদ্রাসা";
    }
  }

  return (

    <>
      <main className="flex-1 overflow-y-auto bg-background">
        <AppHeader
          title="হিফজুল কুরআন ট্র্যাকিং"
          subtitle="সবক · সবকি · মঞ্জিল"
          userName={session.user.name ?? "Admin"}
          userRole={session.user.role}
          tenantName={tenantName}
        />

        <div className="page-pad">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  হিফজ শিক্ষার্থী
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">48</div>
                <p className="text-xs text-muted-foreground">সক্রিয়</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  আজকের সবক সম্পন্ন
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">32</div>
                <p className="text-xs text-muted-foreground">৬৭% সম্পন্ন</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  গড় মান
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৪.১ / ৫</div>
                <p className="text-xs text-muted-foreground">তিলাওয়াত কোয়ালিটি</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  পূর্ণ হিফজ (৩০ পারা)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">সম্পন্ন শিক্ষার্থী</p>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                className="flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button asChild>
              <Link href="/tenant/admin/hifz/entry">
                <Plus className="h-4 w-4" />
                নতুন সবক এন্ট্রি
              </Link>
            </Button>

          </div>

          {/* Student list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                হিফজ শিক্ষার্থী তালিকা
              </CardTitle>
              <CardDescription>
                সবক / সবকি / মঞ্জিল স্ট্রিম অনুযায়ী ট্র্যাকিং
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((s) => {

                  const q = qualityLabel[s.quality] ?? qualityLabel.AVERAGE;
                  return (
                    <div
                      key={s.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.studentId} · জুজ {s.currentJuz} · পৃষ্ঠা {s.currentPage}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={s.sabakToday ? "success" : "secondary"}>
                          {s.sabakToday ? "সবক হয়েছে" : "সবক বাকি"}
                        </Badge>
                        <Badge variant={q.variant}>{q.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {s.totalJuz}/30 পারা
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/tenant/admin/hifz/entry?studentId=${s.id}`}>
                            এন্ট্রি
                          </Link>
                        </Button>

                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
