import { z } from 'zod'

/**
 * Zod schema for all required environment variables.
 *
 * This module is validated at module-load time (i.e., during `next build`
 * and on first server request), so missing or malformed secrets surface
 * immediately rather than at runtime inside a request handler.
 *
 * Client-side variables (NEXT_PUBLIC_*) are safe to include here because
 * Next.js inlines them at build time and they do not contain secrets.
 */
const envSchema = z.object({
  // ── Database ────────────────────────────────────────────────────────────
  /** Pooled connection string for application queries (via PgBouncer). */
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  /** Direct (non-pooled) URL used by Prisma Migrate. */
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid PostgreSQL URL').optional(),

  // ── Supabase ────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // ── Spotify ─────────────────────────────────────────────────────────────
  SPOTIFY_CLIENT_ID: z.string().min(1, 'SPOTIFY_CLIENT_ID is required').optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1, 'SPOTIFY_CLIENT_SECRET is required').optional(),

  // ── Stripe ──────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_')
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_')
    .optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
    .startsWith('pk_', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_')
    .optional(),
  STRIPE_ALLOWED_ORIGINS: z.string().optional(),

  // ── Vercel Cron ─────────────────────────────────────────────────────────
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters').optional(),

  // ── Runtime ─────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
})

type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `Invalid environment variables detected. Fix the following before deploying:\n${formatted}`,
    )
  }

  return result.data
}

/**
 * Type-safe, validated environment variables.
 * Throws at startup if any required variable is missing or malformed.
 */
export const env = parseEnv()
