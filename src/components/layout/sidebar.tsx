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
  Bus,
  Home,
  Package,
  MessageSquare,
  Award,
  Heart,
  Shield,
  AlertCircle,
  PenLine,
  ScrollText,
  Lock,
  Moon,
  Stethoscope,
  Megaphone,
  UsersRound,
  Trophy,
  LibraryBig,
  ClipboardCheck,
  Siren,
  Briefcase,
  Boxes,
  MapPinned,
  HelpCircle,
  Utensils,
  Wrench,
  Scale,
  CalendarRange,
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
  { title: "ভর্তি CRM", href: "/tenant/admin/admission", icon: ClipboardList },
  { title: "শিক্ষার্থী", href: "/tenant/admin/students", icon: Users },
  { title: "একাডেমিক রোলওভার", href: "/tenant/admin/academic/rollover", icon: CalendarRange },
  { title: "উপস্থিতি", href: "/tenant/admin/attendance", icon: ClipboardList },
  { title: "পরীক্ষা ও ফলাফল", href: "/tenant/admin/exams", icon: FileText },
  { title: "হিফজ ট্র্যাকিং", href: "/tenant/admin/hifz", icon: BookOpen },
  { title: "ফি ও অ্যাকাউন্ট", href: "/tenant/admin/finance", icon: Wallet },
  { title: "টাইমটেবল", href: "/tenant/admin/timetable", icon: Calendar },
  { title: "HR ও পে-রোল", href: "/tenant/admin/hr", icon: GraduationCap },
  { title: "লাইব্রেরি", href: "/tenant/admin/library", icon: BookOpen },
  { title: "হোস্টেল", href: "/tenant/admin/hostel", icon: Home },
  { title: "ট্রান্সপোর্ট", href: "/tenant/admin/transport", icon: Bus },
  { title: "ইনভেন্টরি", href: "/tenant/admin/inventory", icon: Package },
  { title: "যোগাযোগ", href: "/tenant/admin/communication", icon: MessageSquare },
  { title: "সার্টিফিকেট", href: "/tenant/admin/certificates", icon: Award },
  { title: "যাকাত/অনুদান", href: "/tenant/admin/donations", icon: Heart },
  { title: "গেট/ভিজিটর", href: "/tenant/admin/gate", icon: Shield },
  { title: "অভিযোগ", href: "/tenant/admin/grievance", icon: AlertCircle },
  { title: "হোমওয়ার্ক", href: "/tenant/admin/homework", icon: PenLine },
  { title: "নোটিশ বোর্ড", href: "/tenant/admin/notices", icon: Megaphone },
  { title: "LMS", href: "/tenant/admin/lms", icon: LibraryBig },
  { title: "অ্যালামনাই", href: "/tenant/admin/alumni", icon: UsersRound },
  { title: "স্বাস্থ্য", href: "/tenant/admin/health", icon: Stethoscope },
  { title: "ক্লাব/স্পোর্টস", href: "/tenant/admin/clubs", icon: Trophy },
  { title: "সার্ভে", href: "/tenant/admin/surveys", icon: ClipboardCheck },
  { title: "প্রশ্নব্যাংক", href: "/tenant/admin/questions", icon: HelpCircle },
  { title: "ক্যারিয়ার", href: "/tenant/admin/career", icon: Briefcase },
  { title: "অ্যাসেট", href: "/tenant/admin/assets", icon: Boxes },
  { title: "ক্যাম্পাস/শাখা", href: "/tenant/admin/campuses", icon: MapPinned },
  { title: "ক্যান্টিন/মেস", href: "/tenant/admin/canteen", icon: Utensils },
  { title: "যানবাহন লগ", href: "/tenant/admin/vehicles", icon: Wrench },
  { title: "ইমার্জেন্সি", href: "/tenant/admin/emergency", icon: Siren },
  { title: "অডিট লগ", href: "/tenant/admin/audit", icon: ScrollText },
  { title: "নামাজ", href: "/tenant/admin/namaz", icon: Moon },
  { title: "হিজরি ক্যালেন্ডার", href: "/tenant/admin/hijri", icon: Calendar },
  { title: "সিকিউরিটি", href: "/tenant/admin/security", icon: Lock },
  { title: "লেজার", href: "/tenant/admin/ledger", icon: Scale },
  { title: "রিপোর্টস", href: "/tenant/admin/reports", icon: BarChart3 },
  { title: "সেটিংস", href: "/tenant/admin/settings", icon: Settings },
];







export interface SidebarUser {
  name: string;
  email?: string | null;
  role: string;
}

interface SidebarProps {
  type: "super" | "super-admin" | "tenant";
  institutionName?: string;
  user?: SidebarUser;
  /** White-label primary brand color (hex) */
  primaryColor?: string | null;
  logoUrl?: string | null;
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

export function Sidebar({
  type,
  institutionName,
  user,
  primaryColor,
  logoUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const isSuper = type === "super" || type === "super-admin";
  const nav = isSuper ? superAdminNav : tenantAdminNav;
  const brand = primaryColor || "#059669";

  return (
    <aside
      className="flex h-screen w-64 flex-col border-r border-border bg-card"
      style={
        {
          ["--brand" as string]: brand,
          ["--brand-soft" as string]: `${brand}18`,
        } as React.CSSProperties
      }
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 w-8 rounded-md object-cover"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: brand }}
          >
            <Mosque className="h-4 w-4" />
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-bold leading-none">Edupro</span>
          {type === "tenant" && institutionName && (
            <span className="max-w-[150px] truncate text-[10px] text-muted-foreground">
              {institutionName}
            </span>
          )}
          {isSuper && (
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
                  ? "font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={
                isActive
                  ? { backgroundColor: `${brand}18`, color: brand }
                  : undefined
              }
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
