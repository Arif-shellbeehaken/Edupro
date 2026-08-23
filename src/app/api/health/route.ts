import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

/**
 * GET /api/health
 * Liveness + DB readiness for load balancers / Docker / K8s.
 */
export async function GET() {
  const started = Date.now();
  let db: "up" | "down" = "down";
  let dbMs = 0;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbMs = Date.now() - t0;
    db = "up";
  } catch {
    db = "down";
  }

  const status = db === "up" ? 200 : 503;

  return NextResponse.json(
    {
      status: db === "up" ? "ok" : "degraded",
      service: "edupro",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: db, latencyMs: dbMs },
      },
      uptimeMs: Math.round(process.uptime() * 1000),
      responseMs: Date.now() - started,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
