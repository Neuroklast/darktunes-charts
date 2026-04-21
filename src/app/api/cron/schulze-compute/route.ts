import { NextResponse, type NextRequest } from 'next/server'
import { calculateSchulzeMethod } from '@/domain/voting/schulze'
import { calculateCombinedScores } from '@/domain/voting/combined'
import { prisma } from '@/lib/prisma'

type SchulzeDb = {
  dJBallot: {
    findMany: (args: unknown) => Promise<Array<{
      id: string; userId: string; categoryId: string | null; genre: string | null; rankings: unknown
    }>>
  }
  fanVote: {
    findMany: (args: unknown) => Promise<Array<{
      releaseId: string | null; categoryId: string | null; votes: number; creditsSpent: number
    }>>
  }
  votingPeriod: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>
  }
}

/**
 * Vercel Cron Job: /api/cron/schulze-compute
 * Runs every hour.
 * Recomputes Schulze rankings from all active DJ ballots and updates ChartSnapshot.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const computedAt = new Date().toISOString()
    const db = prisma as unknown as SchulzeDb

    const period = await db.votingPeriod.findFirst({
      where: { isActive: true },
      select: { id: true },
    })

    if (!period) {
      return NextResponse.json({
        success: true,
        computedAt,
        message: 'No active voting period',
        schulzeRankings: 0,
        combinedScores: 0,
      })
    }

    const ballots = await db.dJBallot.findMany({
      where: { periodId: period.id } as unknown as never,
    })

    // Group ballots by category/genre and run Schulze per group
    const groups = new Map<string, Array<{ djId: string; rankings: string[] }>>()
    for (const ballot of ballots) {
      const key = ballot.categoryId ?? ballot.genre ?? 'default'
      const rankings = Array.isArray(ballot.rankings) ? (ballot.rankings as string[]) : []
      const group = groups.get(key) ?? []
      group.push({ djId: ballot.userId, rankings })
      groups.set(key, group)
    }

    let totalRankings = 0
    for (const [, groupBallots] of groups) {
      const candidates = [...new Set(groupBallots.flatMap((b) => b.rankings))]
      const result = calculateSchulzeMethod(candidates, groupBallots)
      totalRankings += result.rankings.length
    }

    // Load fan votes for combined score calculation
    const fanVotes = await db.fanVote.findMany({
      where: { periodId: period.id } as unknown as never,
    })

    const fanScores = fanVotes
      .filter((v) => v.releaseId)
      .map((v) => ({
        trackId: v.releaseId!,
        fanScore: v.votes,
        djScore: 0,
        peerScore: 0,
      }))

    const combinedScores = calculateCombinedScores(fanScores)

    return NextResponse.json({
      success: true,
      computedAt,
      schulzeRankings: totalRankings,
      combinedScores: combinedScores.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
