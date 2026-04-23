import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { classifyBandTier } from '@/application/actions/classifyBandTier'

type TierRefreshDb = {
  band: {
    findMany: (args: unknown) => Promise<Array<{ id: string; spotifyArtistId: string | null }>>
  }
}

/**
 * GET /api/cron/tier-refresh
 * Vercel Cron: Runs weekly on Sundays at 03:00 UTC.
 *
 * Iterates all active bands, fetches their Spotify follower counts,
 * and re-classifies their competition tier. Tier changes are persisted
 * to the database and logged in the transparency audit trail.
 *
 * Security: Only the Vercel cron scheduler may call this endpoint.
 * The Authorization header is checked against CRON_SECRET.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = prisma as unknown as TierRefreshDb
    const bands = await db.band.findMany({
      where: { spotifyArtistId: { not: null } } as unknown as never,
      select: { id: true, spotifyArtistId: true },
    })

    const results = await Promise.allSettled(
      bands
        .filter((b) => b.spotifyArtistId)
        .map((b) => classifyBandTier(b.id, b.spotifyArtistId!)),
    )

    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ success: boolean }>).value.success,
    ).length
    const failed = results.length - succeeded

    return NextResponse.json({
      success: true,
      processed: results.length,
      succeeded,
      failed,
      runAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
