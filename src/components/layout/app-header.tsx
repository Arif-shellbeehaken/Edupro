"use client";

import { LogOut, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isSuperAdmin && (
          <Badge variant="success">Platform</Badge>
        )}
        {tenantName && !isSuperAdmin && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {tenantName}
          </span>
        )}

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            {userName.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-[10px] text-muted-foreground">
              {roleLabels[userRole] ?? userRole}
            </p>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </div>

        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
