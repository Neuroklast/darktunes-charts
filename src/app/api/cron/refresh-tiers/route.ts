/**
 * GET /api/cron/refresh-tiers
 *
 * Vercel Cron job: runs daily at 03:00 UTC.
 *
 * Refreshes Spotify-derived tier classifications for all bands that have a
 * `spotifyUri`. Delegates to `refreshAllBandTiers()` which handles per-band
 * error isolation and Spotify rate-limit back-off.
 *
 * Security: only the Vercel cron scheduler may call this endpoint.
 * The `Authorization: Bearer <CRON_SECRET>` header is validated.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { refreshAllBandTiers } from '@/infrastructure/spotify/service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { updated, failed } = await refreshAllBandTiers()

    return NextResponse.json({
      success: true,
      processed: updated + failed,
      updated,
      failed,
      runAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
