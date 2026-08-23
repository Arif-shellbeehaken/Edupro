"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Calendar,
  FileText,
  Wallet,
  BookOpen,
  Settings,
  LogOut,
  Mosque,
  Building2,
  CreditCard,
  BarChart3,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/application/use-cases/auth/logout";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const superAdminNav: NavItem[] = [
  { title: "ড্যাশবোর্ড", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { title: "প্রতিষ্ঠানসমূহ", href: "/super-admin/tenants", icon: Building2 },
  { title: "সাবস্ক্রিপশন", href: "/super-admin/subscriptions", icon: CreditCard },
  { title: "রেভিনিউ", href: "/super-admin/revenue", icon: BarChart3 },
  { title: "সাপোর্ট টিকিট", href: "/super-admin/support", icon: Bell },
  { title: "সেটিংস", href: "/super-admin/settings", icon: Settings },
];

const tenantAdminNav: NavItem[] = [
  { title: "ড্যাশবোর্ড", href: "/tenant/admin/dashboard", icon: LayoutDashboard },
  { title: "ভর্তি", href: "/tenant/admin/admission", icon: ClipboardList },
  { title: "শিক্ষার্থী", href: "/tenant/admin/students", icon: Users },
  { title: "উপস্থিতি", href: "/tenant/admin/attendance", icon: ClipboardList },
  { title: "পরীক্ষা ও ফলাফল", href: "/tenant/admin/exams", icon: FileText },
  { title: "হিফজ ট্র্যাকিং", href: "/tenant/admin/hifz", icon: BookOpen },
  { title: "ফি ও অ্যাকাউন্ট", href: "/tenant/admin/finance", icon: Wallet },
  { title: "টাইমটেবল", href: "/tenant/admin/timetable", icon: Calendar },
  { title: "HR ও পে-রোল", href: "/tenant/admin/hr", icon: GraduationCap },

  { title: "সেটিংস", href: "/tenant/admin/settings", icon: Settings },
];

export interface SidebarUser {
  name: string;
  email?: string | null;
  role: string;
}

interface SidebarProps {
  type: "super" | "tenant";
  institutionName?: string;
  user?: SidebarUser;
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "সুপার অ্যাডমিন",
    INSTITUTION_ADMIN: "অ্যাডমিন",
    PRINCIPAL: "প্রিন্সিপাল",
    TEACHER: "শিক্ষক",
    HIFZ_TEACHER: "হিফজ শিক্ষক",
    MUHADDIS: "মুহাদ্দিস",
    ACCOUNTANT: "অ্যাকাউন্ট্যান্ট",
    PARENT: "অভিভাবক",
    STUDENT: "শিক্ষার্থী",
  };
  return map[role] ?? role;
}

export function Sidebar({ type, institutionName, user }: SidebarProps) {
  const pathname = usePathname();
  const nav = type === "super" ? superAdminNav : tenantAdminNav;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
          <Mosque className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold leading-none">Edupro</span>
          {type === "tenant" && institutionName && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
              {institutionName}
            </span>
          )}
          {type === "super" && (
            <span className="text-[10px] text-muted-foreground">Platform Admin</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border p-3 space-y-2">
        {user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {roleLabel(user.role)}
              {user.email ? ` · ${user.email}` : ""}
            </p>
          </div>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            লগআউট
          </button>
        </form>
      </div>
    </aside>
  );
}
