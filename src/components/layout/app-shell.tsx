import type { ReactNode } from "react";
import { Sidebar, type SidebarUser } from "@/components/layout/sidebar";

/**
 * Production app chrome — sidebar + scrollable main.
 * Used by route-group layouts so feature pages stay content-only.
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
    <div className="flex h-screen overflow-hidden bg-background">
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
    <main className="flex-1 overflow-y-auto bg-background">
      {children}
    </main>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  return <div className="space-y-6 p-4 md:p-6">{children}</div>;
}
