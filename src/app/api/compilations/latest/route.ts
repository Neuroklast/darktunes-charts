import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type CompilationRow = {
  id: string
  title: string
  period: string
  status: string
  coverArtUrl: string | null
  description: string | null
  createdAt: Date
  publishedAt: Date | null
  tracks: TrackRow[]
  curators: CuratorRow[]
}

type TrackRow = {
  position: number
  releaseId: string
  trackTitle: string
  bandName: string
  source: string
  chartRank: number | null
}

type CuratorRow = {
  djName: string
  picks: number
}

type CompilationDb = {
  compilation: {
    findFirst: (args: unknown) => Promise<CompilationRow | null>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * GET /api/compilations/latest
 * Returns the most recently published compilation. Public endpoint.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const compilation = await getDb().compilation.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: {
        tracks: { orderBy: { position: 'asc' } },
        curators: true,
      },
    })

    if (!compilation) {
      return NextResponse.json({ error: 'No published compilations found' }, { status: 404 })
    }

    return NextResponse.json({ compilation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
