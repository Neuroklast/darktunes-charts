/**
 * GET /api/v1/compilations
 *
 * Returns all published compilations. Requires a valid API key.
 *
 * The Compilation model was added after the initial Prisma client generation.
 * DB access uses the `(prisma as unknown as ...)` cast pattern.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface CompilationRecord {
  id: string
  title: string
  period: string
  status: string
  coverArtUrl: string | null
  description: string | null
  publishedAt: Date | null
}

interface CompilationDb {
  compilation: {
    findMany: (args: {
      where: { status: string }
      select: {
        id: true
        title: true
        period: true
        status: true
        coverArtUrl: true
        description: true
        publishedAt: true
      }
      orderBy: { publishedAt: 'desc' }
    }) => Promise<CompilationRecord[]>
  }
}

function getDb(): CompilationDb {
  return prisma as unknown as CompilationDb
}

export const GET = withApiKey(async (_request: NextRequest, _ctx: ApiKeyContext) => {
  const db = getDb()

  const compilations = await db.compilation.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      period: true,
      status: true,
      coverArtUrl: true,
      description: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  })

  return NextResponse.json({ compilations })
})
