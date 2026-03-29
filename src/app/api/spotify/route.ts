import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'

/**
 * Spotify artist IDs are 22-character base62 strings (alphanumeric).
 * Validates format before passing to the Spotify API to prevent
 * unexpected inputs (OWASP A03:2021 — Injection).
 */
const spotifyArtistIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]{22}$/, 'Invalid Spotify artist ID format — expected 22 alphanumeric characters')

/**
 * GET /api/spotify?artistId=xxx
 * Fetches Spotify monthly listener data for an artist.
 * Responses are cached for 24 hours.
 */
export async function GET(request: NextRequest) {
  try {
    const rawArtistId = request.nextUrl.searchParams.get('artistId')

    if (!rawArtistId) {
      return NextResponse.json({ error: 'artistId parameter required' }, { status: 400 })
    }

    const parsed = spotifyArtistIdSchema.safeParse(rawArtistId)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid artistId format', details: parsed.error.flatten() },
        { status: 400 },
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
