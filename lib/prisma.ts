// Singleton Prisma client. Avoids exhausting connections under Next.js
// dev hot-reload, which otherwise instantiates a new client per reload.
// In production (each serverless invocation) the global cache is empty,
// which is the desired behavior.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
