"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  Activity,
  Menu,
  X,
} from "lucide-react";





import { cn } from "@/lib/utils";
import { logoutAction } from "@/application/use-cases/auth/logout";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const superAdminNav: NavItem[] = [
  { title: "ড্যাশবোর্ড", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { title: "প্রতিষ্ঠানসমূহ", href: "/super-admin/tenants", icon: Building2 },
  { title: "সাবস্ক্রিপশন", href: "/super-admin/subscriptions", icon: CreditCard },
  { title: "রেভিনিউ", href: "/super-admin/revenue", icon: BarChart3 },
  { title: "সাপোর্ট টিকিট", href: "/super-admin/support", icon: Bell },
  { title: "সেটিংস", href: "/super-admin/settings", icon: Settings },
];

const tenantAdminSections: NavSection[] = [
  {
    label: "মূল",
    items: [
      { title: "শিক্ষক পোর্টাল", href: "/tenant/teacher", icon: GraduationCap },
      { title: "ড্যাশবোর্ড", href: "/tenant/admin/dashboard", icon: LayoutDashboard },
      { title: "ভর্তি CRM", href: "/tenant/admin/admission", icon: ClipboardList },
      { title: "মেধাতালিকা", href: "/tenant/admin/admission/merit", icon: ClipboardList },
      { title: "অনলাইন MCQ", href: "/tenant/admin/exams/mcq", icon: FileText },
      { title: "সিবলিং/ডকুমেন্ট", href: "/tenant/admin/students/siblings", icon: Users },
      { title: "রিপোর্টস", href: "/tenant/admin/reports", icon: BarChart3 },
      { title: "ঝরে পড়ার ঝুঁকি", href: "/tenant/admin/reports/dropout", icon: BarChart3 },
    ],
  },
  {
    label: "একাডেমিক",
    items: [
      { title: "শিক্ষার্থী", href: "/tenant/admin/students", icon: Users },
      { title: "উপস্থিতি", href: "/tenant/admin/attendance", icon: ClipboardList },
      { title: "পরীক্ষা ও ফলাফল", href: "/tenant/admin/exams", icon: FileText },
      { title: "হোমওয়ার্ক", href: "/tenant/admin/homework", icon: PenLine },
      { title: "টাইমটেবল", href: "/tenant/admin/timetable", icon: Calendar },
      { title: "হিফজ ট্র্যাকিং", href: "/tenant/admin/hifz", icon: BookOpen },
      { title: "LMS", href: "/tenant/admin/lms", icon: LibraryBig },
      { title: "প্রশ্নব্যাংক", href: "/tenant/admin/questions", icon: HelpCircle },
      { title: "একাডেমিক রোলওভার", href: "/tenant/admin/academic/rollover", icon: CalendarRange },
    ],
  },
  {
    label: "অর্থ ও HR",
    items: [
      { title: "ফি ও অ্যাকাউন্ট", href: "/tenant/admin/finance", icon: Wallet },
      { title: "লেজার", href: "/tenant/admin/ledger", icon: Scale },
      { title: "HR ও পে-রোল", href: "/tenant/admin/hr", icon: GraduationCap },
      { title: "যাকাত/অনুদান", href: "/tenant/admin/donations", icon: Heart },
    ],
  },
  {
    label: "অপারেশন",
    items: [
      { title: "লাইব্রেরি", href: "/tenant/admin/library", icon: BookOpen },
      { title: "হোস্টেল", href: "/tenant/admin/hostel", icon: Home },
      { title: "ট্রান্সপোর্ট", href: "/tenant/admin/transport", icon: Bus },
      { title: "ইনভেন্টরি", href: "/tenant/admin/inventory", icon: Package },
      { title: "ক্যান্টিন/মেস", href: "/tenant/admin/canteen", icon: Utensils },
      { title: "গেট/ভিজিটর", href: "/tenant/admin/gate", icon: Shield },
      { title: "যানবাহন লগ", href: "/tenant/admin/vehicles", icon: Wrench },
      { title: "অ্যাসেট", href: "/tenant/admin/assets", icon: Boxes },
    ],
  },
  {
    label: "যোগাযোগ ও সেবা",
    items: [
      { title: "যোগাযোগ", href: "/tenant/admin/communication", icon: MessageSquare },
      { title: "মেসেজিং", href: "/tenant/admin/messaging", icon: MessageSquare },
      { title: "নোটিশ বোর্ড", href: "/tenant/admin/notices", icon: Megaphone },
      { title: "সার্টিফিকেট", href: "/tenant/admin/certificates", icon: Award },
      { title: "অভিযোগ", href: "/tenant/admin/grievance", icon: AlertCircle },
      { title: "সার্ভে", href: "/tenant/admin/surveys", icon: ClipboardCheck },
      { title: "ইমার্জেন্সি", href: "/tenant/admin/emergency", icon: Siren },
    ],
  },
  {
    label: "অন্যান্য",
    items: [
      { title: "অ্যালামনাই", href: "/tenant/admin/alumni", icon: UsersRound },
      { title: "স্বাস্থ্য", href: "/tenant/admin/health", icon: Stethoscope },
      { title: "ক্লাব/স্পোর্টস", href: "/tenant/admin/clubs", icon: Trophy },
      { title: "ক্যারিয়ার", href: "/tenant/admin/career", icon: Briefcase },
      { title: "ক্যাম্পাস/শাখা", href: "/tenant/admin/campuses", icon: MapPinned },
      { title: "নামাজ", href: "/tenant/admin/namaz", icon: Moon },
      { title: "হিজরি ক্যালেন্ডার", href: "/tenant/admin/hijri", icon: Calendar },
      { title: "অডিট লগ", href: "/tenant/admin/audit", icon: ScrollText },
      { title: "সিকিউরিটি", href: "/tenant/admin/security", icon: Lock },
      { title: "সিস্টেম স্ট্যাটাস", href: "/tenant/admin/system", icon: Activity },
      { title: "সেটিংস", href: "/tenant/admin/settings", icon: Settings },
    ],
  },
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
  const nav = isSuper ? superAdminNav : [];
  const sections = isSuper ? [] : tenantAdminSections;
  const brand = primaryColor || "#059669";
  const [navQuery, setNavQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);


  const q = navQuery.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.href.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, q]);


  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-3 md:hidden">
        <button
          type="button"
          aria-label="মেনু"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold">Edupro</span>
        {type === "tenant" && institutionName && (
          <span className="truncate text-xs text-muted-foreground">
            {institutionName}
          </span>
        )}
      </div>
      {/* Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="বন্ধ"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    <aside
      className={
        "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:z-auto md:translate-x-0 " +
        (mobileOpen ? "translate-x-0" : "-translate-x-full")
      }
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
        <button
          type="button"
          className="ml-auto rounded-lg p-1.5 hover:bg-muted md:hidden"
          aria-label="বন্ধ"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3 overflow-y-auto p-3">
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
        {!isSuper && (
          <div className="px-1 pb-2">
            <input
              type="search"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="মডিউল খুঁজুন..."
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>
        )}
        {filteredSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
          </div>
        ))}
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
    </>
  );
}
