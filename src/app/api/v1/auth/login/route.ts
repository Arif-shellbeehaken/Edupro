import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { signMobileToken } from "@/lib/mobile-token";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId, logger } from "@/lib/logger";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * POST /api/v1/auth/login
 * Mobile / API client login — returns Bearer access token (7d).
 */
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ইমেইল ও পাসওয়ার্ড দিন" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  try {
    const user = await prisma.user.findFirst({
      where: { email, isActive: true, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        nameBn: true,
        role: true,
        tenantId: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" }, { status: 401 });
    }

    const ok = await compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" }, { status: 401 });
    }

    const accessToken = signMobileToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      name: user.nameBn || user.name,
      email: user.email,
      isSuperAdmin: user.role === "SUPER_ADMIN",
    });

    logger.info("api_v1_login", { requestId, userId: user.id });

    return NextResponse.json(
      {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 60 * 60 * 24 * 7,
        user: {
          id: user.id,
          email: user.email,
          name: user.nameBn || user.name,
          role: user.role,
          tenantId: user.tenantId,
          isSuperAdmin: user.role === "SUPER_ADMIN",
        },
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (e) {
    logger.error("api_v1_login_fail", { requestId, err: String(e) });
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
