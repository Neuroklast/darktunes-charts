import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 configuration file.
 *
 * - `datasource.url`: used by `prisma migrate` / `prisma db push` commands.
 *   Uses DIRECT_URL (bypasses PgBouncer) so schema migrations work reliably.
 * - The PrismaClient adapter (PrismaPg) is configured separately in
 *   `src/lib/prisma.ts` using DATABASE_URL for application queries.
 */
export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
})
