/** In-memory parent OTP challenges for mobile API (single-node / dev).
 * Production: use Redis with same key shape.
 */
type Challenge = { otp: string; tenantId: string; exp: number };

const g = globalThis as unknown as { __eduproParentOtp?: Map<string, Challenge> };
if (!g.__eduproParentOtp) g.__eduproParentOtp = new Map();

export function setParentOtp(phone: string, data: Challenge) {
  g.__eduproParentOtp!.set(phone, data);
}

export function getParentOtp(phone: string): Challenge | null {
  const c = g.__eduproParentOtp!.get(phone);
  if (!c) return null;
  if (Date.now() > c.exp) {
    g.__eduproParentOtp!.delete(phone);
    return null;
  }
  return c;
}

export function clearParentOtp(phone: string) {
  g.__eduproParentOtp!.delete(phone);
}
