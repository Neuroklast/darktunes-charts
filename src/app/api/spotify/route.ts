import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'
import { withCORS } from '@/lib/auth/rbac'

/**
 * Validation schema for Spotify artist ID.
 * Artist IDs are 22-character alphanumeric strings.
 */
const spotifyArtistIdSchema = z.string().regex(
  /^[a-zA-Z0-9]{22}$/,
  'Invalid Spotify artist ID format'
)

/**
 * GET /api/spotify?artistId=xxx
 * Fetches Spotify monthly listener data for an artist.
 *
 * Security:
 * - Input validation: artistId must be a valid 22-character Spotify ID
 * - Responses are cached for 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get('artistId')

    if (!artistId) {
      return withCORS(NextResponse.json({ error: 'artistId parameter required' }, { status: 400 }))
    }

    // Validate artist ID format to prevent injection attacks
    const validation = spotifyArtistIdSchema.safeParse(artistId)
    if (!validation.success) {
      return withCORS(NextResponse.json(
        { error: 'Invalid artistId format', details: validation.error.flatten() },
        { status: 400 }
      ))
    }

    const data = await getMonthlyListeners(validation.data)

    return withCORS(NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}
