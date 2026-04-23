import { NextResponse, type NextRequest } from 'next/server'
import { generateAIPrediction } from '@/domain/voting/prediction'
import { prisma } from '@/lib/prisma'

type AIPredictionDb = {
  band: {
    findUnique: (args: unknown) => Promise<{
      id: string; spotifyMonthlyListeners: number; tier: string; genre: string
    } | null>
  }
  fanVote: {
    findMany: (args: unknown) => Promise<Array<{ votes: number; createdAt: Date }>>
  }
}

/**
 * GET /api/ai-prediction?bandId=xxx
 * Returns AI prediction data for a band.
 */
export async function GET(request: NextRequest) {
  try {
    const bandId = request.nextUrl.searchParams.get('bandId')

    if (!bandId) {
      return NextResponse.json({ error: 'bandId parameter required' }, { status: 400 })
    }

    const db = prisma as unknown as AIPredictionDb

    const band = await db.band.findUnique({
      where: { id: bandId },
      select: { spotifyMonthlyListeners: true, tier: true, genre: true },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    const recentVotes = await db.fanVote.findMany({
      where: { release: { bandId } } as unknown as never,
      orderBy: { createdAt: 'desc' } as unknown as never,
      take: 100,
    })

    const historicalVotes = recentVotes.map((v) => ({
      timestamp: v.createdAt.getTime(),
      votes: v.votes,
    }))

    const previousListeners = Math.max(
      1,
      Math.floor(band.spotifyMonthlyListeners * 0.9),
    )

    const prediction = generateAIPrediction(
      bandId,
      historicalVotes,
      band.spotifyMonthlyListeners,
      previousListeners,
      1.0,
    )

    return NextResponse.json({ prediction })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
