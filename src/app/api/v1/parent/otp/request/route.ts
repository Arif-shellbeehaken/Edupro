import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { rateLimitAsync } from "@/infrastructure/security/rate-limit";
import { setParentOtp } from "@/lib/parent-otp-store";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { newRequestId } from "@/lib/logger";

const schema = z.object({
  phone: z.string().min(10),
  tenantSlug: z.string().optional(),
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
    return NextResponse.json({ error: "সঠিক মোবাইল নম্বর দিন" }, { status: 400 });
  }
  const phone = parsed.data.phone.replace(/\s+/g, "").trim();
  const rl = await rateLimitAsync(`otp:${phone}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `সীমা পেরিয়েছে। ${rl.retryAfterSec}s পর চেষ্টা করুন` },
      { status: 429 }
    );
  }

  let tenantId: string | undefined;
  if (parsed.data.tenantSlug) {
    const t = await prisma.tenant.findFirst({
      where: { slug: parsed.data.tenantSlug },
      select: { id: true },
    });
    tenantId = t?.id;
  }

  const students = await prisma.student.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(tenantId ? { tenantId } : {}),
      OR: [{ guardianPhone: phone }, { fatherPhone: phone }],
    },
    select: { tenantId: true, name: true, nameBn: true },
    take: 5,
  });
  if (students.length === 0) {
    return NextResponse.json(
      { error: "এই নম্বরে কোনো শিক্ষার্থী লিংক নেই" },
      { status: 404 }
    );
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const tid = students[0]!.tenantId;
  setParentOtp(phone, {
    otp,
    tenantId: tid,
    exp: Date.now() + 10 * 60 * 1000,
  });

  try {
    const { communicationRepository } = await import(
      "@/infrastructure/database/repositories/communication-repository"
    );
    const names = students.map((s) => s.nameBn || s.name).join(", ");
    await communicationRepository.sendMessage({
      tenantId: tid,
      channel: "SMS",
      recipient: phone,
      subject: "PARENT_OTP",
      body: `Edupro অভিভাবক OTP: ${otp} (${names})। ১০ মিনিট।`,
      relatedType: "PARENT_OTP",
      relatedId: phone,
    });
  } catch (e) {
    console.error("parent otp sms", e);
  }

  return NextResponse.json(
    {
      success: true,
      message: "OTP পাঠানো হয়েছে",
      // Dev helper when SMS sandbox
      ...(process.env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
      meta: { requestId },
    },
    { headers: { "X-Request-Id": requestId } }
  );
}
