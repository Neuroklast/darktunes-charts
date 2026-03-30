import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'

/**
 * Spotify artist IDs are 22-character base-62 strings (alphanumeric).
 * This schema validates the format before passing it to the external API.
 */
const spotifyArtistIdSchema = z
  .string()
  .regex(/^[0-9A-Za-z]{22}$/, 'Invalid Spotify artist ID format')

/**
 * GET /api/spotify?artistId=xxx
 * Fetches Spotify monthly listener data for an artist.
 * Responses are cached for 24 hours.
 *
 * Validates `artistId` as a 22-character base-62 string (Spotify format).
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get('artistId')

    if (!artistId) {
      return NextResponse.json({ error: 'artistId parameter required' }, { status: 400 })
    }

    const parsed = spotifyArtistIdSchema.safeParse(artistId)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid artistId format', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = await getMonthlyListeners(parsed.data)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
