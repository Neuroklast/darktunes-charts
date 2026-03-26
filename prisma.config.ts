import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma 7 configuration file.
 * Database connection URLs are managed here instead of the schema file.
 * See: https://pris.ly/d/config-datasource
 */
export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    async adapter() {
      const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
      if (!connectionString) {
        throw new Error('DIRECT_URL or DATABASE_URL environment variable must be set for migrations')
      }
      return new PrismaPg({ connectionString })
    },
  },
})
