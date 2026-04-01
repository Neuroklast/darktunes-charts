/**
 * POST /api/admin/spotify/refresh-tiers
 *
 * Admin-only endpoint that triggers a full Spotify tier refresh for all bands
 * that have a `spotifyUri` stored in the database.
 *
 * Delegates to `refreshAllBandTiers()` which handles per-band error isolation
 * and applies a 100 ms rate-limit delay between Spotify API calls.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { refreshAllBandTiers } from '@/infrastructure/spotify/service'

export const dynamic = 'force-dynamic'

export const POST = withAuth(
  ['ADMIN'],
  async (_request: NextRequest): Promise<NextResponse> => {
    try {
      const result = await refreshAllBandTiers()
      return NextResponse.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
