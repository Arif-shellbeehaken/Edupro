/**
 * Rate limiter — Redis when REDIS_URL is set, else in-memory.
 * Production multi-instance: set REDIS_URL (ioredis-compatible REST not required;
 * uses native fetch to Upstash REST if UPSTASH_REDIS_REST_URL + TOKEN set,
 * otherwise in-memory with process-local Map).
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
  backend: "memory" | "upstash";
};

type Entry = { count: number; resetAt: number };
const memoryStore = new Map<string, Entry>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cur = memoryStore.get(key);
  if (!cur || now >= cur.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      remaining: limit - 1,
      retryAfterSec: Math.ceil(windowMs / 1000),
      backend: "memory",
    };
  }
  if (cur.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
      backend: "memory",
    };
  }
  cur.count += 1;
  return {
    ok: true,
    remaining: limit - cur.count,
    retryAfterSec: Math.ceil((cur.resetAt - now) / 1000),
    backend: "memory",
  };
}

/** Upstash Redis REST sliding counter (INCR + EXPIRE) */
async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const fullKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const incrRes = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", fullKey],
        ["EXPIRE", fullKey, String(windowSec), "NX"],
        ["TTL", fullKey],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!incrRes.ok) return null;
    const data = (await incrRes.json()) as { result?: unknown }[];
    const count = Number(data?.[0]?.result ?? 0);
    const ttl = Number(data?.[2]?.result ?? windowSec);
    if (count > limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSec: Math.max(1, ttl > 0 ? ttl : windowSec),
        backend: "upstash",
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, limit - count),
      retryAfterSec: Math.max(1, ttl > 0 ? ttl : windowSec),
      backend: "upstash",
    };
  } catch {
    return null;
  }
}

/**
 * Sync API used by server actions — prefers Upstash when configured,
 * falls back to memory immediately (non-blocking).
 * For strict Redis, use rateLimitAsync.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  return memoryLimit(key, limit, windowMs);
}

export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const remote = await upstashLimit(key, limit, windowMs);
  if (remote) return remote;
  return memoryLimit(key, limit, windowMs);
}

// Cleanup memory store
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore) {
      if (now >= v.resetAt) memoryStore.delete(k);
    }
  }, 60_000).unref?.();
}
