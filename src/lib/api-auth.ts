import { auth } from "@/infrastructure/auth/auth";
import { NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-token";

export type ApiAuthResult = {
  error: NextResponse | null;
  session: {
    user: {
      id?: string;
      tenantId?: string | null;
      isSuperAdmin?: boolean;
      role?: string;
      name?: string | null;
      email?: string;
    };
  } | null;
  authMethod: "session" | "api_key" | "mobile_token" | null;
};

function parseApiKeyMap(): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = process.env.API_KEYS;
  if (raw) {
    try {
      Object.assign(out, JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
  }
  const single = process.env.API_KEY;
  const tid = process.env.API_KEY_TENANT_ID;
  if (single && tid) out[single] = tid;
  return out;
}

/**
 * Guard for /api/v1/*
 * 1) Mobile JWT (Authorization: Bearer <mobile token>)
 * 2) API key (x-api-key or Bearer mapped key)
 * 3) Session cookie (Auth.js)
 */
export async function requireApiSession(
  req?: Request
): Promise<ApiAuthResult> {
  if (req) {
    const bearer =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const headerKey = req.headers.get("x-api-key") || "";

    // Mobile JWT
    if (bearer && bearer.split(".").length === 3) {
      const payload = verifyMobileToken(bearer);
      if (payload) {
        return {
          error: null,
          session: {
            user: {
              id: payload.sub,
              tenantId: payload.tenantId,
              isSuperAdmin: payload.isSuperAdmin,
              role: payload.role,
              name: payload.name,
              email: payload.email,
            },
          },
          authMethod: "mobile_token",
        };
      }
    }

    const key = headerKey || bearer;
    if (key) {
      const map = parseApiKeyMap();
      const tenantId = map[key];
      if (tenantId) {
        return {
          error: null,
          session: {
            user: {
              id: `api-key:${key.slice(0, 8)}`,
              tenantId,
              isSuperAdmin: false,
              role: "API_INTEGRATION",
              name: "API Key",
            },
          },
          authMethod: "api_key",
        };
      }
      if (headerKey) {
        return {
          error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
          session: null,
          authMethod: null,
        };
      }
    }
  }

  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      authMethod: null,
    };
  }
  return {
    error: null,
    session: session as ApiAuthResult["session"],
    authMethod: "session",
  };
}
