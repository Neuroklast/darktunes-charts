/**
 * GET /api/v1/bands/[slug]
 *
 * Returns a band's public profile by slug. Requires a valid API key.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ slug: string }>
}

export function GET(request: NextRequest, context: RouteContext) {
  return withApiKey(async (_req: NextRequest, _ctx: ApiKeyContext) => {
    const { slug } = await context.params

    const band = await prisma.band.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        genre: true,
        genres: true,
        tier: true,
        spotifyMonthlyListeners: true,
        spotifyUri: true,
        country: true,
        bio: true,
        imageUrl: true,
        coverArtUrl: true,
        formedYear: true,
        isVerified: true,
      },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    return NextResponse.json({ band })
  })(request)
}
