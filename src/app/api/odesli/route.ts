import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/odesli?url=xxx
 * Returns universal streaming links via Odesli / song.link API.
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'url parameter required' }, { status: 400 })
    }

    // Dynamically import to avoid issues with server-side imports
    const { fetchOdesliLinks } = await import('@/infrastructure/api/odesli')
    const result = await fetchOdesliLinks(url)

    if (!result) {
      return NextResponse.json({ error: 'No streaming links found for this URL' }, { status: 404 })
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
