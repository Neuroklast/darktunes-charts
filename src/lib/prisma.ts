import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

/**
 * Lazy Prisma Client singleton using a Proxy.
 *
 * The real PrismaClient is NOT created at module-import time — only on first
 * property access (e.g. `prisma.user.findUnique(...)`).
 *
 * This allows `next build` to statically analyse API routes without requiring
 * DATABASE_URL to be set in the build environment.  The error is still thrown
 * clearly when the client is actually used at runtime without the variable.
 *
 * In development, the same instance is reused across hot reloads via the
 * `globalForPrisma` global to avoid exhausting connection pool limits.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop]
  },
})
