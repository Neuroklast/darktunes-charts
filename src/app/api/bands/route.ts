import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security/rbac'
import { createRateLimiter, withRateLimit, getRateLimitKey } from '@/infrastructure/security/rateLimiter'
import { PUBLIC_RATE_LIMIT } from '@/infrastructure/security/rateLimitConfig'

const publicLimiter = createRateLimiter(PUBLIC_RATE_LIMIT)

const createBandSchema = z.object({
  name: z.string().min(1).max(200),
  genre: z.enum(['GOTH', 'METAL', 'DARK_ELECTRO', 'POST_PUNK', 'INDUSTRIAL', 'DARKWAVE', 'EBM', 'SYMPHONIC_METAL', 'AGGROTECH', 'NEOFOLK']),
  spotifyArtistId: z.string().optional(),
  country: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
})

/**
 * GET /api/bands
 * Returns a list of all registered bands.
 * Rate limited: 60 requests/minute per IP.
 */
export const GET = withRateLimit(
  publicLimiter,
  async () => {
    // In production: const bands = await prisma.band.findMany({ include: { tracks: true } })
    return NextResponse.json({ bands: [] })
  },
  (req: NextRequest) => getRateLimitKey(req),
)

/**
 * POST /api/bands
 * Creates a new band registration. Restricted to BAND role.
 */
export const POST = withAuth(['band'], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = createBandSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // In production: const band = await prisma.band.create({ data: { ...parsed.data, ownerId: user.id } })
  return NextResponse.json({ success: true, band: { id: 'new-band-id', ...parsed.data } })
})
