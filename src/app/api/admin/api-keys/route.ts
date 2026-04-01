/**
 * GET  /api/admin/api-keys  — List all API keys (admin only)
 * POST /api/admin/api-keys  — Create a new API key (admin only)
 *
 * On POST, a cryptographically random 32-byte key is generated. The plain-text
 * key is returned exactly once in the response; only its SHA-256 hash is stored
 * in the database. Partners must store the key securely at creation time.
 *
 * The ApiKey model was added after the initial Prisma client generation.
 * DB access uses the `(prisma as unknown as ...)` cast pattern.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes, createHash } from 'node:crypto'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

// ─── DB shape ─────────────────────────────────────────────────────────────────

interface ApiKeyListRecord {
  id: string
  name: string
  partnerId: string
  rateLimit: number
  createdAt: Date
  lastUsedAt: Date | null
}

interface ApiKeyDb {
  apiKey: {
    findMany: (args: {
      select: {
        id: true
        name: true
        partnerId: true
        rateLimit: true
        createdAt: true
        lastUsedAt: true
      }
      orderBy: { createdAt: 'desc' }
    }) => Promise<ApiKeyListRecord[]>
    create: (args: {
      data: {
        name: string
        partnerId: string
        keyHash: string
        rateLimit: number
        permissions: string[]
      }
    }) => Promise<{ id: string }>
  }
}

function getDb(): ApiKeyDb {
  return prisma as unknown as ApiKeyDb
}

// ─── Validation ───────────────────────────────────────────────────────────────

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  partnerId: z.string().min(1).max(100),
  rateLimit: z.number().int().positive().default(1000),
  permissions: z.array(z.string()).default([]),
})

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const GET = withAuth(
  ['ADMIN'],
  async (_request: NextRequest): Promise<NextResponse> => {
    const db = getDb()

    const keys = await db.apiKey.findMany({
      select: {
        id: true,
        name: true,
        partnerId: true,
        rateLimit: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ keys })
  },
)

export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest): Promise<NextResponse> => {
    const body: unknown = await request.json()
    const parsed = createKeySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const plainKey = randomBytes(32).toString('hex')
    const keyHash = createHash('sha256').update(plainKey).digest('hex')

    const db = getDb()
    const record = await db.apiKey.create({
      data: {
        name: parsed.data.name,
        partnerId: parsed.data.partnerId,
        keyHash,
        rateLimit: parsed.data.rateLimit,
        permissions: parsed.data.permissions,
      },
    })

    return NextResponse.json(
      {
        id: record.id,
        plainKey,
        message: 'Store this key securely — it will not be shown again.',
      },
      { status: 201 },
    )
  },
)
