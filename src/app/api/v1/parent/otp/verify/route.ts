import { NextResponse } from "next/server";
import { z } from "zod";
import { getParentOtp, clearParentOtp } from "@/lib/parent-otp-store";
import { signMobileToken } from "@/lib/mobile-token";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId } from "@/lib/logger";

const schema = z.object({
  phone: z.string().min(10),
  otp: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "৬-ডিজিট OTP দিন" }, { status: 400 });
  }

  const phone = parsed.data.phone.replace(/\s+/g, "").trim();
  const challenge = getParentOtp(phone);
  if (!challenge) {
    return NextResponse.json(
      { error: "OTP মেয়াদ শেষ — আবার রিকোয়েস্ট করুন" },
      { status: 400 }
    );
  }
  if (challenge.otp !== parsed.data.otp) {
    return NextResponse.json({ error: "OTP সঠিক নয়" }, { status: 401 });
  }

  clearParentOtp(phone);

  const accessToken = signMobileToken({
    sub: `parent:${phone}`,
    tenantId: challenge.tenantId,
    role: "PARENT",
    name: "অভিভাবক",
    email: `${phone}@parent.local`,
    isSuperAdmin: false,
  });

  return NextResponse.json(
    {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 60 * 60 * 24 * 7,
      user: {
        id: `parent:${phone}`,
        phone,
        role: "PARENT",
        tenantId: challenge.tenantId,
        name: "অভিভাবক",
      },
      meta: { requestId },
    },
    { headers: { "X-Request-Id": requestId } }
  );
}
