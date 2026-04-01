import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import {
  validateCompilation,
  finalizeCompilation,
  type Compilation,
  type CompilationTrack,
  type CompilationCurator,
} from '@/domain/compilation'
import { createAuditLog } from '@/infrastructure/audit'

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
  curatorId: string | null
  curatorNote: string | null
}

type CuratorRow = {
  userId: string
  djName: string
  picks: number
  lastCuratedPeriod: string | null
}

type CompilationDb = {
  compilation: {
    findUnique: (args: unknown) => Promise<CompilationRow | null>
    update: (args: unknown) => Promise<unknown>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

function mapStatus(status: string): Compilation['status'] {
  const map: Record<string, Compilation['status']> = {
    DRAFT: 'draft',
    CURATING: 'curating',
    FINALIZED: 'finalized',
    PUBLISHED: 'published',
  }
  return map[status] ?? 'draft'
}

const domainStatusToDb: Record<Compilation['status'], string> = {
  draft: 'DRAFT',
  curating: 'CURATING',
  finalized: 'FINALIZED',
  published: 'PUBLISHED',
}

function mapSource(source: string): CompilationTrack['source'] {
  return source === 'CURATOR_PICK' ? 'curator-pick' : 'chart'
}

/**
 * POST /api/admin/compilations/[id]/finalize
 *
 * Validates and finalizes a compilation. Admin only.
 * Returns 422 if validation fails.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const compilationId = pathSegments[pathSegments.length - 2]

      const row = await getDb().compilation.findUnique({
        where: { id: compilationId },
        include: {
          tracks: { orderBy: { position: 'asc' } },
          curators: true,
        },
      })

      if (!row) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
      }

      const compilation: Compilation = {
        id: row.id,
        title: row.title,
        period: row.period,
        status: mapStatus(row.status),
        coverArtUrl: row.coverArtUrl ?? undefined,
        description: row.description ?? undefined,
        createdAt: row.createdAt,
        publishedAt: row.publishedAt ?? undefined,
        tracks: row.tracks.map((t): CompilationTrack => ({
          position: t.position,
          releaseId: t.releaseId,
          trackTitle: t.trackTitle,
          bandName: t.bandName,
          source: mapSource(t.source),
          chartRank: t.chartRank ?? undefined,
          curatorId: t.curatorId ?? undefined,
          curatorNote: t.curatorNote ?? undefined,
        })),
        curators: row.curators.map((c): CompilationCurator => ({
          userId: c.userId,
          djName: c.djName,
          picks: c.picks,
          lastCuratedPeriod: c.lastCuratedPeriod ?? undefined,
        })),
      }

      const { valid, errors } = validateCompilation(compilation)

      if (!valid) {
        return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })
      }

      const finalized = finalizeCompilation(compilation)

      await getDb().compilation.update({
        where: { id: compilationId },
        data: { status: domainStatusToDb[finalized.status] },
      })

      await createAuditLog(
        'compilation_finalized',
        'Compilation',
        compilationId,
        user.id,
        { trackCount: compilation.tracks.length },
      )

      return NextResponse.json({ success: true, status: finalized.status })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
