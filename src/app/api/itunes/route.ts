import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/itunes?trackId=xxx OR /api/itunes?q=searchTerm
 * Returns iTunes track metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const trackId = request.nextUrl.searchParams.get('trackId')
    const query = request.nextUrl.searchParams.get('q')

    if (!trackId && !query) {
      return NextResponse.json({ error: 'trackId or q parameter required' }, { status: 400 })
    }

    const { lookupItunesTrack, searchItunesTracks } = await import('@/infrastructure/api/itunes')

    if (trackId) {
      const track = await lookupItunesTrack(parseInt(trackId, 10))
      return NextResponse.json({ track })
    }

    const tracks = await searchItunesTracks(query!)
    return NextResponse.json({ tracks })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
