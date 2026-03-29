import { NextResponse, type NextRequest } from 'next/server'
import { calculateCombinedScores } from '@/domain/voting/combined'
import { createRateLimiter, withRateLimit, getRateLimitKey } from '@/infrastructure/security/rateLimiter'
import { PUBLIC_RATE_LIMIT } from '@/infrastructure/security/rateLimitConfig'

const publicLimiter = createRateLimiter(PUBLIC_RATE_LIMIT)

/**
 * GET /api/charts
 * Returns aggregated chart data (Fan/DJ/Band/Combined 33/33/33).
 * Response is cached for 60 seconds.
 * Rate limited: 60 requests/minute per IP.
 */
export const GET = withRateLimit(
  publicLimiter,
  async () => {
    // In production, fetch from database:
    // const rawScores = await prisma.chartSnapshot.findMany({ where: { period: { isActive: true } } })

    const mockRawScores = [
      { trackId: 'example-track-1', fanScore: 100, djScore: 85, peerScore: 90 },
      { trackId: 'example-track-2', fanScore: 75, djScore: 95, peerScore: 70 },
    ]

    const combinedScores = calculateCombinedScores(mockRawScores)

    return NextResponse.json(
      { scores: combinedScores },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  },
  (req: NextRequest) => getRateLimitKey(req),
)
