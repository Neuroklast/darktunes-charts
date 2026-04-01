import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { selectChartTracks, type ChartResultEntry } from '@/domain/compilation'
import { createAuditLog } from '@/infrastructure/audit'

type ChartResultRow = {
  releaseId: string
  rank: number
  categoryId: string
  release: {
    title: string
    genres: string[]
    band: { name: string } | null
  }
}

type CompilationDb = {
  chartResult: {
    findMany: (args: unknown) => Promise<ChartResultRow[]>
  }
  compilationTrackEntry: {
    deleteMany: (args: unknown) => Promise<unknown>
    createMany: (args: unknown) => Promise<unknown>
  }
  compilation: {
    findUnique: (args: unknown) => Promise<{ id: string; status: string } | null>
    update: (args: unknown) => Promise<unknown>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * POST /api/admin/compilations/[id]/select-chart-tracks
 *
 * Auto-selects chart tracks for a compilation based on the latest published
 * chart results. Replaces any existing chart-sourced tracks. Admin only.
 *
 * Body: { votingPeriodId: string; count?: number }
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const compilationId = pathSegments[pathSegments.length - 2]

      const body: unknown = await request.json()
      const bodyObj = body as Record<string, unknown>
      const votingPeriodId = typeof bodyObj.votingPeriodId === 'string'
        ? bodyObj.votingPeriodId
        : null
      const count = typeof bodyObj.count === 'number' ? bodyObj.count : 12

      if (!votingPeriodId) {
        return NextResponse.json({ error: 'votingPeriodId is required' }, { status: 400 })
      }

      const compilation = await getDb().compilation.findUnique({
        where: { id: compilationId },
        select: { id: true, status: true },
      })

      if (!compilation) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
      }

      const rawResults = await getDb().chartResult.findMany({
        where: { votingPeriodId },
        include: {
          release: {
            select: {
              title: true,
              genres: true,
              band: { select: { name: true } },
            },
          },
        },
        orderBy: { rank: 'asc' },
      })

      const chartEntries: ChartResultEntry[] = rawResults.map((r) => ({
        releaseId: r.releaseId,
        rank: r.rank,
        categoryId: r.categoryId,
        bandName: r.release.band?.name ?? 'Unknown',
        trackTitle: r.release.title,
        genres: r.release.genres,
      }))

      const selectedTracks = selectChartTracks(chartEntries, count)

      await getDb().compilationTrackEntry.deleteMany({
        where: { compilationId, source: 'CHART' },
      })

      await getDb().compilationTrackEntry.createMany({
        data: selectedTracks.map((t) => ({
          compilationId,
          position: t.position,
          releaseId: t.releaseId,
          trackTitle: t.trackTitle,
          bandName: t.bandName,
          source: 'CHART',
          chartRank: t.chartRank ?? null,
        })),
      })

      await getDb().compilation.update({
        where: { id: compilationId },
        data: { status: 'CURATING' },
      })

      await createAuditLog(
        'compilation_chart_tracks_selected',
        'Compilation',
        compilationId,
        user.id,
        { count: selectedTracks.length, votingPeriodId },
      )

      return NextResponse.json({ tracksSelected: selectedTracks.length })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
