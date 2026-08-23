import { auth } from "@/infrastructure/auth/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/domain/enums";

/**
 * Auth + Route Protection Middleware
 *
 * Rules:
 * - /login, / → public
 * - /super-admin/* → Super Admin only
 * - /tenant/* → authenticated non-super (or super with caution)
 * - Unauthenticated → redirect to /login
 */

const publicPaths = ["/", "/login"];
const authPaths = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  // Public routes
  if (publicPaths.includes(pathname) || pathname.startsWith("/api/auth")) {
    // If already logged in and hitting login, redirect to dashboard
    if (isLoggedIn && authPaths.includes(pathname)) {
      const role = session.user.role;
      const isSuper = session.user.isSuperAdmin;
      const dest = isSuper
        ? "/super-admin/dashboard"
        : "/tenant/admin/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Must be logged in for everything else under these prefixes
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Super Admin area
  if (pathname.startsWith("/super-admin")) {
    if (!session.user.isSuperAdmin) {
      return NextResponse.redirect(new URL("/tenant/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Tenant area — Super Admin can view but normal flow is tenant users
  if (pathname.startsWith("/tenant")) {
    // Allow Super Admin to inspect (optional: restrict later)
    if (session.user.isSuperAdmin) {
      return NextResponse.next();
    }
    // Must have a tenant
    if (!session.user.tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next internals
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
