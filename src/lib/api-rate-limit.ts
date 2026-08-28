import { NextResponse } from "next/server";
import { rateLimitAsync } from "@/infrastructure/security/rate-limit";

/**
 * Rate-limit /api/v1 by API key fingerprint or IP.
 * Default: 120 requests / 60s
 */
export async function enforceApiRateLimit(req: Request): Promise<NextResponse | null> {
  const key =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anon";
  const fingerprint = key.slice(0, 32);
  const limit = Number(process.env.API_RATE_LIMIT || 120);
  const windowMs = Number(process.env.API_RATE_WINDOW_MS || 60_000);

  const rl = await rateLimitAsync(`api_v1:${fingerprint}`, limit, windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfterSec: rl.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}
