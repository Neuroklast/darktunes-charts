import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { calculateSchulzeMethod } from '@/domain/voting/schulze'
import { withAuth, type AuthenticatedUser } from '@/infrastructure/security/rbac'
import { createRateLimiter, withRateLimit, getRateLimitKey } from '@/infrastructure/security/rateLimiter'
import { VOTE_RATE_LIMIT } from '@/infrastructure/security/rateLimitConfig'

const voteLimiter = createRateLimiter(VOTE_RATE_LIMIT)

const djBallotRequestSchema = z.object({
  periodId: z.string().uuid(),
  genre: z.string(),
  rankings: z.array(z.string().uuid()).min(1).max(100),
  candidates: z.array(z.string().uuid()).min(1).max(100),
})

/**
 * POST /api/votes/dj
 * Accepts DJ ranked-choice ballot submissions.
 * Validates and triggers Schulze calculation.
 * Rate limited: 10 requests/minute per user.
 */
export const POST = withRateLimit(
  voteLimiter,
  withAuth(['dj'], async (request: NextRequest, user: AuthenticatedUser) => {
    const body: unknown = await request.json()
    const parsed = djBallotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { rankings, candidates } = parsed.data
    const schulzeResult = calculateSchulzeMethod(candidates, [
      { djId: user.id, rankings },
    ])

    return NextResponse.json({ success: true, schulzeResult })
  }),
  (req) => getRateLimitKey(req),
)
