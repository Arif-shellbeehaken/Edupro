import type { ReactNode } from "react";
import { Sidebar, type SidebarUser } from "@/components/layout/sidebar";

/**
 * Production app chrome — responsive sidebar + scrollable main.
 */
export function AppShell({
  type,
  institutionName,
  user,
  primaryColor,
  logoUrl,
  children,
}: {
  type: "super" | "super-admin" | "tenant";
  institutionName?: string;
  user?: SidebarUser;
  primaryColor?: string | null;
  logoUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        মূল কন্টেন্টে যান
      </a>
      <Sidebar
        type={type}
        institutionName={institutionName}
        user={user}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-background safe-bottom outline-none"
    >
      {children}
    </main>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  return <div className="page-pad">{children}</div>;
}
