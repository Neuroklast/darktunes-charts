/**
 * GET /api/bands/[id]/spotify
 *
 * Public endpoint that returns the cached Spotify data for a band.
 *
 * Returns the Spotify-sourced fields stored on the band record
 * (`spotifyMonthlyListeners`, `tier`, `spotifyUri`, `spotifyArtistId`).
 *
 * If the band has a `spotifyUri` and the record was last updated more than
 * 24 hours ago, a non-blocking background refresh is triggered so that
 * subsequent requests will receive fresher data.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshBandTier } from '@/infrastructure/spotify/service'

export const dynamic = 'force-dynamic'

/** Stale threshold: 24 hours in milliseconds. */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params

    const band = await prisma.band.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        spotifyUri: true,
        spotifyArtistId: true,
        spotifyMonthlyListeners: true,
        tier: true,
        updatedAt: true,
      },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    if (!band.spotifyUri) {
      return NextResponse.json({ error: 'Band has no Spotify URI' }, { status: 404 })
    }

    const isStale = Date.now() - band.updatedAt.getTime() > STALE_THRESHOLD_MS

    if (isStale) {
      // Fire-and-forget background refresh — do not block the response.
      void refreshBandTier(band.id).catch(() => {
        // Swallow errors to avoid unhandled rejections; the stale data is
        // still better than no response.
      })
    }

    return NextResponse.json({
      bandId: band.id,
      name: band.name,
      spotifyUri: band.spotifyUri,
      spotifyArtistId: band.spotifyArtistId,
      spotifyMonthlyListeners: band.spotifyMonthlyListeners,
      tier: band.tier,
      updatedAt: band.updatedAt.toISOString(),
      isStale,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
