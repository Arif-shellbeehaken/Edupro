import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireApiSession } from "@/lib/api-auth";
import { newRequestId } from "@/lib/logger";

/** GET /api/v1/notices — published notices for tenant */
export async function GET(req: Request) {
  const limited = await enforceApiRateLimit(req);
  if (limited) return limited;
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const { error, session } = await requireApiSession(req);
  if (error || !session?.user.tenantId) {
    return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notices = await prisma.notice.findMany({
    where: { tenantId: session.user.tenantId, isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      titleBn: true,
      body: true,
      audience: true,
      publishedAt: true,
    },
  });

  return NextResponse.json(
    { data: notices, meta: { requestId } },
    { headers: { "X-Request-Id": requestId } }
  );
}
