import { auth } from "@/infrastructure/auth/auth";
import { NextResponse } from "next/server";

export type ApiAuthResult = {
  error: NextResponse | null;
  session: {
    user: {
      id?: string;
      tenantId?: string | null;
      isSuperAdmin?: boolean;
      role?: string;
      name?: string | null;
    };
  } | null;
  authMethod: "session" | "api_key" | null;
};

/**
 * Guard for /api/v1/*
 * 1) Session JWT (browser / staff)
 * 2) API key: header `x-api-key` or `Authorization: Bearer <key>`
 *
 * Keys configured as env JSON:
 *   API_KEYS='{"demo_key_1":"tenantCuidHere","other_key":"tenantCuid2"}'
 * Or single key for one tenant:
 *   API_KEY=demo_key_1
 *   API_KEY_TENANT_ID=clxxxx
 */
export async function requireApiSession(
  req?: Request
): Promise<ApiAuthResult> {
  // API key path
  if (req) {
    const headerKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";
    if (headerKey) {
      const map = parseApiKeyMap();
      const tenantId = map[headerKey];
      if (tenantId) {
        return {
          error: null,
          session: {
            user: {
              id: `api-key:${headerKey.slice(0, 8)}`,
              tenantId,
              isSuperAdmin: false,
              role: "API_INTEGRATION",
              name: "API Key",
            },
          },
          authMethod: "api_key",
        };
      }
      // If key provided but invalid
      if (
        headerKey.length > 8 &&
        !req.headers.get("cookie")?.includes("authjs")
      ) {
        // only hard-fail when looks like intentional API key (not session cookie path)
        const onlyKey =
          !req.headers.get("cookie") ||
          req.headers.get("x-api-key") !== null;
        if (req.headers.get("x-api-key")) {
          return {
            error: NextResponse.json(
              { error: "Invalid API key" },
              { status: 401 }
            ),
            session: null,
            authMethod: null,
          };
        }
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

function parseApiKeyMap(): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = process.env.API_KEYS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.assign(out, parsed);
    } catch {
      /* ignore bad JSON */
    }
  }
  const single = process.env.API_KEY;
  const tid = process.env.API_KEY_TENANT_ID;
  if (single && tid) out[single] = tid;
  return out;
}
