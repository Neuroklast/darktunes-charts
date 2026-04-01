/**
 * @module lib/apiKeyAuth
 *
 * API key authentication middleware for the public v1 API.
 *
 * Keys are never stored in plain text. On creation a random 32-byte value is
 * generated, the caller receives it once, and only the SHA-256 hash is
 * persisted in the `api_keys` table.
 *
 * Authentication supports two delivery mechanisms:
 *  1. `X-API-Key` header (preferred for server-to-server calls)
 *  2. `?api_key=` query parameter (convenient for quick testing)
 *
 * Because the ApiKey model was added after the initial Prisma migration, the
 * Prisma client has not been regenerated. All DB access therefore uses the
 * `(prisma as unknown as ApiKeyDb)` cast pattern that is established in this
 * codebase for post-generation models.
 */

import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ApiKeyContext {
  partnerId: string
  permissions: string[]
  rateLimit: number
}

// ─── Internal DB shape ────────────────────────────────────────────────────────

interface ApiKeyRecord {
  id: string
  partnerId: string
  permissions: unknown
  rateLimit: number
}

interface ApiKeyDb {
  apiKey: {
    findUnique: (args: {
      where: { keyHash: string }
      select: { id: true; partnerId: true; permissions: true; rateLimit: true }
    }) => Promise<ApiKeyRecord | null>
    update: (args: {
      where: { id: string }
      data: { lastUsedAt: Date }
    }) => Promise<unknown>
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function getDb(): ApiKeyDb {
  return prisma as unknown as ApiKeyDb
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Validates the API key present in the request and returns its associated context.
 *
 * Checks `X-API-Key` header first, then `?api_key=` query parameter.
 * On a successful match, `lastUsedAt` is updated asynchronously.
 *
 * @param request - Incoming Next.js request.
 * @returns `ApiKeyContext` when the key is valid, `null` otherwise.
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const apiKey =
    request.headers.get('X-API-Key') ??
    request.nextUrl.searchParams.get('api_key')

  if (!apiKey) return null

  const keyHash = hashApiKey(apiKey)
  const db = getDb()

  const record = await db.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, partnerId: true, permissions: true, rateLimit: true },
  })

  if (!record) return null

  // Fire-and-forget — do not await to avoid blocking the response.
  void db.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  })

  const permissions = Array.isArray(record.permissions)
    ? (record.permissions as string[])
    : []

  return {
    partnerId: record.partnerId,
    permissions,
    rateLimit: record.rateLimit,
  }
}

/**
 * Higher-order function that wraps an API route handler with API key auth.
 *
 * Returns HTTP 401 when no valid key is present or the key lookup fails.
 *
 * @param handler - The inner route handler that receives the validated context.
 * @returns A standard Next.js route handler.
 *
 * @example
 * export const GET = withApiKey(async (req, ctx) => {
 *   return NextResponse.json({ partnerId: ctx.partnerId })
 * })
 */
export function withApiKey(
  handler: (request: NextRequest, context: ApiKeyContext) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const context = await validateApiKey(request)

      if (!context) {
        return NextResponse.json(
          { error: 'Unauthorized: valid API key required' },
          { status: 401 },
        )
      }

      return await handler(request, context)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
