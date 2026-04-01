/**
 * GET /api/v1/compilations/[id]
 *
 * Returns a single published compilation with its full tracklist.
 * Requires a valid API key.
 *
 * The Compilation and CompilationTrackEntry models were added after the initial
 * Prisma client generation. DB access uses the `(prisma as unknown as ...)` cast.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface TrackEntry {
  id: string
  position: number
  trackTitle: string
  bandName: string
  source: string
  chartRank: number | null
  curatorNote: string | null
  releaseId: string
}

interface CompilationWithTracks {
  id: string
  title: string
  period: string
  status: string
  coverArtUrl: string | null
  description: string | null
  publishedAt: Date | null
  tracks: TrackEntry[]
}

interface CompilationDb {
  compilation: {
    findUnique: (args: {
      where: { id: string }
      select: {
        id: true
        title: true
        period: true
        status: true
        coverArtUrl: true
        description: true
        publishedAt: true
        tracks: {
          select: {
            id: true
            position: true
            trackTitle: true
            bandName: true
            source: true
            chartRank: true
            curatorNote: true
            releaseId: true
          }
          orderBy: { position: 'asc' }
        }
      }
    }) => Promise<CompilationWithTracks | null>
  }
}

function getDb(): CompilationDb {
  return prisma as unknown as CompilationDb
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export function GET(request: NextRequest, context: RouteContext) {
  return withApiKey(async (_req: NextRequest, _ctx: ApiKeyContext) => {
    const { id } = await context.params
    const db = getDb()

    const compilation = await db.compilation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        period: true,
        status: true,
        coverArtUrl: true,
        description: true,
        publishedAt: true,
        tracks: {
          select: {
            id: true,
            position: true,
            trackTitle: true,
            bandName: true,
            source: true,
            chartRank: true,
            curatorNote: true,
            releaseId: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!compilation) {
      return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
    }

    if (compilation.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
    }

    return NextResponse.json({ compilation })
  })(request)
}
