/**
 * GET /api/v1/genres
 *
 * Returns the full dark music genre taxonomy.
 * Requires a valid API key.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { GENRE_TAXONOMY, getAllGenres } from '@/domain/genres'

export const dynamic = 'force-dynamic'

export const GET = withApiKey(async (_request: NextRequest, _ctx: ApiKeyContext) => {
  const allGenres = getAllGenres()

  return NextResponse.json({
    taxonomy: GENRE_TAXONOMY,
    genres: allGenres,
    total: allGenres.length,
  })
})
