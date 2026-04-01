import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
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
  id: string
  position: number
  releaseId: string
  trackTitle: string
  bandName: string
  source: string
  chartRank: number | null
  curatorId: string | null
  curatorNote: string | null
}

type CuratorRow = {
  id: string
  userId: string
  djName: string
  picks: number
  lastCuratedPeriod: string | null
}

type CompilationDb = {
  compilation: {
    findUnique: (args: unknown) => Promise<CompilationRow | null>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * GET /api/admin/compilations/[id]
 * Returns a compilation with its tracks and curators. Admin only.
 */
export const GET = withAuth(
  ['ADMIN'],
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const id = pathSegments[pathSegments.length - 1]

      if (!id) {
        return NextResponse.json({ error: 'Compilation ID is required' }, { status: 400 })
      }

      const compilation = await getDb().compilation.findUnique({
        where: { id },
        include: {
          tracks: { orderBy: { position: 'asc' } },
          curators: true,
        },
      })

      if (!compilation) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
      }

      return NextResponse.json({ compilation })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
