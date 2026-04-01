import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  calculateBandInsights,
  type BandInsightsInput,
  type FanVoteData,
  type ChartResultData,
  type RegionData,
  type BasicBandInsights,
} from '@/domain/analytics/bandInsights'

type BandRow = {
  id: string
  subscriptionTier: string
}

type FanVoteRow = {
  userId: string
  votes: number
  user: { region: string | null }
}

type ChartResultRow = {
  categoryId: string
  rank: number
}

type AnalyticsDb = {
  band: {
    findUnique: (args: unknown) => Promise<BandRow | null>
  }
  user: {
    findUnique: (args: unknown) => Promise<{ subscriptionTier: string } | null>
  }
  fanVote: {
    findMany: (args: unknown) => Promise<FanVoteRow[]>
  }
  chartResult: {
    findMany: (args: unknown) => Promise<ChartResultRow[]>
  }
  dJBallot: {
    count: (args: unknown) => Promise<number>
  }
}

function getDb() {
  return prisma as unknown as AnalyticsDb
}

/**
 * GET /api/bands/[id]/analytics
 *
 * Returns band analytics. Access level depends on subscription tier:
 * - FREE: 403
 * - PRO: BasicBandInsights only
 * - PRO_PLUS: Full BandInsights
 *
 * Query params: period (required, YYYY-MM format)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathSegments = new URL(request.url).pathname.split('/')
    const analyticsIndex = pathSegments.indexOf('analytics')
    const bandId = pathSegments[analyticsIndex - 1]

    const url = new URL(request.url)
    const period = url.searchParams.get('period')

    if (!period) {
      return NextResponse.json({ error: 'period query parameter is required' }, { status: 400 })
    }

    const band = await getDb().band.findUnique({
      where: { id: bandId },
      select: { id: true, subscriptionTier: true },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    if (band.subscriptionTier === 'FREE') {
      return NextResponse.json(
        { error: 'Analytics require a Pro or Pro+ subscription' },
        { status: 403 },
      )
    }

    const [fanVotes, chartResults, djMentionCount] = await Promise.all([
      getDb().fanVote.findMany({
        where: { release: { bandId } },
        select: {
          userId: true,
          votes: true,
          user: { select: { region: true } },
        },
      }),
      getDb().chartResult.findMany({
        where: { release: { bandId } },
        select: { categoryId: true, rank: true },
      }),
      getDb().dJBallot.count({ where: { entries: { some: { track: { bandId } } } } }),
    ])

    const fanVoteData: FanVoteData[] = fanVotes.map((v) => ({
      userId: v.userId,
      votes: v.votes,
    }))

    const chartResultData: ChartResultData[] = chartResults.map((r) => ({
      categoryId: r.categoryId,
      rank: r.rank,
    }))

    const regionMap = new Map<string, number>()
    for (const vote of fanVotes) {
      if (!vote.user.region) continue
      regionMap.set(vote.user.region, (regionMap.get(vote.user.region) ?? 0) + 1)
    }
    const regions: RegionData[] = Array.from(regionMap.entries()).map(([region, count]) => ({
      region,
      count,
    }))

    const input: BandInsightsInput = {
      bandId,
      period,
      fanVotes: fanVoteData,
      djMentions: djMentionCount,
      chartResults: chartResultData,
      regions,
    }

    if (band.subscriptionTier === 'PRO_PLUS') {
      const insights = calculateBandInsights(input)
      return NextResponse.json({ insights })
    }

    const basicInsights: BasicBandInsights = {
      bandId,
      period,
      totalFanVotes: fanVoteData.reduce((sum, v) => sum + v.votes, 0),
      totalDJMentions: djMentionCount,
      averageChartPosition:
        chartResultData.length > 0
          ? chartResultData.reduce((sum, r) => sum + r.rank, 0) / chartResultData.length
          : null,
      bestCategory:
        chartResultData.length > 0
          ? chartResultData.reduce((best, r) => (r.rank < best.rank ? r : best)).categoryId
          : null,
    }

    return NextResponse.json({ insights: basicInsights })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
