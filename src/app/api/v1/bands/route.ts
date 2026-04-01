/**
 * GET /api/v1/bands
 *
 * Returns a paginated list of bands. Requires a valid API key.
 *
 * Query parameters:
 *  - `genre`    Filter by genre enum value (case-insensitive match against stored value)
 *  - `tier`     Filter by tier (MICRO | EMERGING | ESTABLISHED | INTERNATIONAL | MACRO)
 *  - `search`   Full-text search on band name
 *  - `page`     Page number (default: 1)
 *  - `perPage`  Items per page (default: 20, max: 100)
 *
 * Returns only public-safe fields: id, name, slug, genre, tier,
 * spotifyMonthlyListeners, country.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

export const GET = withApiKey(async (request: NextRequest, _ctx: ApiKeyContext) => {
  const { searchParams } = request.nextUrl

  const genre = searchParams.get('genre')
  const tier = searchParams.get('tier')
  const search = searchParams.get('search')

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || DEFAULT_PAGE)
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10) || DEFAULT_PER_PAGE),
  )

  const where = {
    ...(genre ? { genre: genre.toUpperCase() as never } : {}),
    ...(tier ? { tier: tier.toUpperCase() as never } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as never } } : {}),
  }

  const [total, bands] = await Promise.all([
    prisma.band.count({ where }),
    prisma.band.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        genre: true,
        tier: true,
        spotifyMonthlyListeners: true,
        country: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({
    bands,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  })
})
