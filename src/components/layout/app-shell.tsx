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
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background safe-bottom">
      {children}
    </main>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  return <div className="page-pad">{children}</div>;
}
