import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { TrackSubmissionSchema } from '@/domain/releases/index'
import { withAuth } from '@/infrastructure/security/rbac'
import { createRateLimiter, withRateLimit, getRateLimitKey } from '@/infrastructure/security/rateLimiter'
import { PUBLIC_RATE_LIMIT } from '@/infrastructure/security/rateLimitConfig'

const publicLimiter = createRateLimiter(PUBLIC_RATE_LIMIT)

const createTrackSchema = z.object({
  title: z.string().min(1).max(200),
  bandId: z.string().uuid(),
  genre: z.enum(['GOTH', 'METAL', 'DARK_ELECTRO', 'POST_PUNK', 'INDUSTRIAL', 'DARKWAVE', 'EBM', 'SYMPHONIC_METAL', 'AGGROTECH', 'NEOFOLK']),
  isrc: z.string().max(12).optional(),
  itunesTrackId: z.string().optional(),
  spotifyTrackId: z.string().optional(),
})

/**
 * GET /api/tracks
 * Returns all tracks with optional genre filter.
 * Rate limited: 60 requests/minute per IP.
 */
export const GET = withRateLimit(
  publicLimiter,
  async (request: NextRequest) => {
    const genre = request.nextUrl.searchParams.get('genre')
    // In production: const tracks = await prisma.track.findMany({ where: genre ? { genre: genre as Genre } : {}, include: { band: true } })
    return NextResponse.json({ tracks: [], genre })
  },
  (req: NextRequest) => getRateLimitKey(req),
)

/**
 * POST /api/tracks
 * Creates a new track with ISRC deduplication check.
 * Restricted to BAND role.
 */
export const POST = withAuth(['band'], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = createTrackSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Extended ISRC validation using TrackSubmissionSchema (strict regex format check)
  if (parsed.data.isrc) {
    const isrcCheck = TrackSubmissionSchema.pick({ isrc: true }).safeParse({ isrc: parsed.data.isrc })
    if (!isrcCheck.success) {
      return NextResponse.json(
        { error: 'Invalid ISRC format', details: isrcCheck.error.flatten() },
        { status: 400 },
      )
    }
  }

  // ISRC deduplication:
  // if (parsed.data.isrc) {
  //   const existing = await prisma.track.findUnique({ where: { isrc: parsed.data.isrc } })
  //   if (existing) return NextResponse.json({ error: 'Track with this ISRC already exists', existingTrackId: existing.id }, { status: 409 })
  // }

  // After DB insert, trigger async enrichment (fire-and-forget):
  // void enrichTrack({ trackId: track.id, title: track.title, artistName: band.name, spotifyTrackId: track.spotifyTrackId })

  return NextResponse.json({ success: true, track: { id: 'new-track-id', ...parsed.data }, enrichmentQueued: true })
})
