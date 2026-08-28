"use client";

import { LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/application/use-cases/auth/logout";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: string;
  tenantName?: string | null;
  isSuperAdmin?: boolean;
}

const roleLabels: Record<string, string> = {
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

export function AppHeader({
  title,
  subtitle,
  userName,
  userRole,
  tenantName,
  isSuperAdmin,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-2 border-b border-border bg-card/90 px-3 backdrop-blur-md sm:min-h-16 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        {subtitle && (
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {isSuperAdmin && (
          <Badge variant="success" className="hidden xs:inline-flex sm:inline-flex">
            Platform
          </Badge>
        )}
        {tenantName && !isSuperAdmin && (
          <span className="hidden max-w-[120px] truncate text-xs text-muted-foreground lg:inline">
            {tenantName}
          </span>
        )}

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1 sm:px-3 sm:py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {userName.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="max-w-[100px] truncate text-sm font-medium leading-none">
              {userName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {roleLabels[userRole] ?? userRole}
            </p>
          </div>
        </div>

        <form action={logoutAction} className="hidden sm:block">
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="h-3.5 w-3.5" />
            <span className="ml-1">লগআউট</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
