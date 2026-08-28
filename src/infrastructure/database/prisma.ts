import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

/**
 * Prisma Client singleton
 *
 * Pooling: append ?connection_limit=10&pool_timeout=20 to DATABASE_URL
 * Replica: set DATABASE_URL_READ and use getReadPrisma() for heavy reads
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRead: PrismaClient | undefined;
};

function createClient(url?: string) {
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createClient(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Read-replica client when DATABASE_URL_READ is set; else primary */
export function getReadPrisma(): PrismaClient {
  const readUrl = process.env.DATABASE_URL_READ;
  if (!readUrl) return prisma;
  if (!globalForPrisma.prismaRead) {
    globalForPrisma.prismaRead = createClient(readUrl);
    logger.info("prisma_read_replica_enabled");
  }
  return globalForPrisma.prismaRead;
}
