import { createHmac, timingSafeEqual } from "crypto";

export type MobileTokenPayload = {
  sub: string;
  tenantId: string | null;
  role: string;
  name: string | null;
  email: string;
  isSuperAdmin: boolean;
  exp: number;
  iat: number;
};

function secret(): string {
  return (
    process.env.MOBILE_JWT_SECRET ||
    process.env.AUTH_SECRET ||
    "edupro-dev-mobile-secret-change-me"
  );
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

/** Issue HS256-like compact token (header.payload.sig) — no external jose dep */
export function signMobileToken(
  payload: Omit<MobileTokenPayload, "exp" | "iat">,
  ttlSec = 60 * 60 * 24 * 7
): string {
  const now = Math.floor(Date.now() / 1000);
  const body: MobileTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSec,
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const mid = b64url(JSON.stringify(body));
  const data = `${header}.${mid}`;
  const sig = createHmac("sha256", secret()).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, mid, sig] = parts;
    const data = `${header}.${mid}`;
    const expected = createHmac("sha256", secret()).update(data).digest();
    const actual = fromB64url(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }
    const payload = JSON.parse(fromB64url(mid).toString("utf8")) as MobileTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
