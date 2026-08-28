import { auth } from "@/infrastructure/auth/auth";
import { NextResponse } from "next/server";
import { newRequestId } from "@/lib/logger";

/**
 * Auth + Route Protection + security headers + X-Request-Id
 */

const publicExact = new Set(["/", "/login"]);
const publicPrefixes = [
  "/api/auth",
  "/api/health",
  "/api/cron",
  "/parent",
];

function isPublic(pathname: string) {
  if (publicExact.has(pathname)) return true;
  return publicPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function withSecurityHeaders(res: NextResponse, requestId: string) {
  res.headers.set("X-Request-Id", requestId);
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.headers.set("X-DNS-Prefetch-Control", "on");
  if (!res.headers.has("Content-Security-Policy")) {
    res.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
    );
  }
  return res;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const requestId = req.headers.get("x-request-id") || newRequestId();

  if (isPublic(pathname)) {
    if (isLoggedIn && pathname === "/login") {
      const dest = session.user.isSuperAdmin
        ? "/super-admin/dashboard"
        : "/tenant/admin/dashboard";
      return withSecurityHeaders(
        NextResponse.redirect(new URL(dest, req.url)),
        requestId
      );
    }
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl), requestId);
  }

  if (pathname.startsWith("/super-admin")) {
    if (!session.user.isSuperAdmin) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/tenant/admin/dashboard", req.url)),
        requestId
      );
    }
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  if (pathname.startsWith("/tenant")) {
    if (session.user.isSuperAdmin) {
      return withSecurityHeaders(NextResponse.next(), requestId);
    }
    if (!session.user.tenantId) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/login", req.url)),
        requestId
      );
    }
    return withSecurityHeaders(NextResponse.next(), requestId);
  }

  return withSecurityHeaders(NextResponse.next(), requestId);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
