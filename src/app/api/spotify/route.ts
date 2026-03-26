import { NextResponse, type NextRequest } from 'next/server'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'

/**
 * GET /api/spotify?artistId=xxx
 * Fetches Spotify monthly listener data for an artist.
 * Responses are cached for 24 hours.
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get('artistId')

    if (!artistId) {
      return NextResponse.json({ error: 'artistId parameter required' }, { status: 400 })
    }

    const data = await getMonthlyListeners(artistId)

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
