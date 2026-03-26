import { defineConfig } from 'prisma/config'

/**
 * Prisma configuration file.
 * Schema path is declared here. Database connection URLs are managed
 * via environment variables in the datasource block of schema.prisma
 * and at runtime via the PrismaPg adapter in src/lib/prisma.ts.
 */
export default defineConfig({
  schema: './prisma/schema.prisma',
})
