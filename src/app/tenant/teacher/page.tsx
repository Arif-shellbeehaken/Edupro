import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import {
  ClipboardCheck,
  BookOpen,
  PenLine,
  Calendar,
  Users,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const links = [
  {
    title: "উপস্থিতি",
    href: "/tenant/admin/attendance",
    icon: ClipboardCheck,
    desc: "দৈনিক মার্ক",
  },
  {
    title: "হোমওয়ার্ক",
    href: "/tenant/admin/homework",
    icon: PenLine,
    desc: "অ্যাসাইনমেন্ট",
  },
  {
    title: "হিফজ এন্ট্রি",
    href: "/tenant/admin/hifz/entry",
    icon: BookOpen,
    desc: "সবক / রিভিশন",
  },
  {
    title: "রুটিন",
    href: "/tenant/admin/timetable",
    icon: Calendar,
    desc: "ক্লাস টাইমটেবল",
  },
  {
    title: "MCQ পরীক্ষা",
    href: "/tenant/admin/exams/mcq",
    icon: GraduationCap,
    desc: "অনলাইন টেস্ট",
  },
  {
    title: "LMS / Meet",
    href: "/tenant/admin/lms",
    icon: Users,
    desc: "ম্যাটেরিয়াল ও লিংক",
  },
  {
    title: "মেসেজিং",
    href: "/tenant/admin/messaging",
    icon: MessageSquare,
    desc: "অভিভাবক যোগাযোগ",
  },
];

export default async function TeacherPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role || "";
  const allowed = [
    "TEACHER",
    "HIFZ_TEACHER",
    "MUHADDIS",
    "INSTITUTION_ADMIN",
    "PRINCIPAL",
    "SUPER_ADMIN",
  ];
  // Still allow other staff to view shortcuts
  const name = session.user.name || "Teacher";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">শিক্ষক পোর্টাল</h1>
            <p className="text-sm text-muted-foreground">
              {name} · {role}
              {!allowed.includes(role) && session.user.isSuperAdmin
                ? ""
                : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tenant/admin/dashboard">অ্যাডমিন ড্যাশবোর্ড</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">দ্রুত লিংক</CardTitle>
            <CardDescription>
              দৈনন্দিন শিক্ষক কাজ — এক ক্লিকে মডিউলে যান
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-start gap-3 rounded-lg border p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <l.icon className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-sm">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
