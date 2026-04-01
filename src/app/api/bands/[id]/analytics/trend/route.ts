import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calculateVoteTrend, type TrendEntry } from '@/domain/analytics/bandInsights'

type BandRow = { subscriptionTier: string }

type TrendDb = {
  band: { findUnique: (args: unknown) => Promise<BandRow | null> }
  fanVote: { findMany: (args: unknown) => Promise<Array<{ votes: number; period: { name: string | null }; periodId: string }>> }
  chartResult: { findMany: (args: unknown) => Promise<Array<{ rank: number; votingPeriodId: string }>> }
}

function getDb() {
  return prisma as unknown as TrendDb
}

/**
 * GET /api/bands/[id]/analytics/trend
 * Returns historical vote trend data. Pro+ only.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathSegments = new URL(request.url).pathname.split('/')
    const trendIndex = pathSegments.indexOf('trend')
    const bandId = pathSegments[trendIndex - 2]

    const band = await getDb().band.findUnique({
      where: { id: bandId },
      select: { subscriptionTier: true },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    if (band.subscriptionTier !== 'PRO_PLUS') {
      return NextResponse.json({ error: 'Pro+ subscription required' }, { status: 403 })
    }

    const [fanVotes, chartResults] = await Promise.all([
      getDb().fanVote.findMany({
        where: { release: { bandId } },
        select: { votes: true, periodId: true, period: { select: { name: true } } },
      }),
      getDb().chartResult.findMany({
        where: { release: { bandId } },
        select: { rank: true, votingPeriodId: true },
      }),
    ])

    const periodVotes = new Map<string, number>()
    for (const v of fanVotes) {
      periodVotes.set(v.periodId, (periodVotes.get(v.periodId) ?? 0) + v.votes)
    }

    const periodChartPosition = new Map<string, number>()
    for (const r of chartResults) {
      const existing = periodChartPosition.get(r.votingPeriodId)
      if (existing === undefined || r.rank < existing) {
        periodChartPosition.set(r.votingPeriodId, r.rank)
      }
    }

    const allPeriodIds = new Set([
      ...periodVotes.keys(),
      ...periodChartPosition.keys(),
    ])

    const entries: TrendEntry[] = Array.from(allPeriodIds).map((periodId) => ({
      period: periodId,
      fanVotes: periodVotes.get(periodId) ?? 0,
      // djMentions aggregation requires cross-ballot analysis; populated as 0 until that pipeline is available
      djMentions: 0,
      chartPosition: periodChartPosition.get(periodId) ?? null,
    }))

    const trend = calculateVoteTrend(entries)

    return NextResponse.json({ trend })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
