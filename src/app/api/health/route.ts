import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { logger, newRequestId } from "@/lib/logger";

/**
 * GET /api/health
 * Liveness + dependency matrix for LB / K8s / monitoring.
 */
export async function GET(req: Request) {
  const started = Date.now();
  const requestId =
    req.headers.get("x-request-id") || newRequestId();

  let db: "up" | "down" = "down";
  let dbMs = 0;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbMs = Date.now() - t0;
    db = "up";
  } catch {
    db = "down";
    logger.warn("health_db_down", { requestId });
  }

  const upstashConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
  const readReplica = !!process.env.DATABASE_URL_READ;
  const smsProvider = process.env.SMS_PROVIDER || "console";
  const nodeEnv = process.env.NODE_ENV || "development";

  const healthy = db === "up";
  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "edupro",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      requestId,
      checks: {
        database: { status: db, latencyMs: dbMs },
        rateLimitBackend: upstashConfigured ? "upstash" : "memory",
        readReplica: readReplica ? "configured" : "primary-only",
        sms: smsProvider,
      },
      env: nodeEnv,
      uptimeMs: Math.round(process.uptime() * 1000),
      responseMs: Date.now() - started,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    }
  );
}
