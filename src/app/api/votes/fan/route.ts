import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { calculateQuadraticCost, validateFanVotes, MONTHLY_CREDIT_BUDGET } from '@/domain/voting/quadratic'
import { withAuth, type AuthenticatedUser } from '@/infrastructure/security/rbac'
import { createRateLimiter, withRateLimit, getRateLimitKey } from '@/infrastructure/security/rateLimiter'
import { VOTE_RATE_LIMIT } from '@/infrastructure/security/rateLimitConfig'

const voteLimiter = createRateLimiter(VOTE_RATE_LIMIT)

const fanVoteRequestSchema = z.object({
  votes: z.array(z.object({
    trackId: z.string().uuid(),
    votes: z.number().int().min(0).max(10),
    periodId: z.string().uuid(),
  })).max(50),
})

/**
 * POST /api/votes/fan
 * Accepts fan vote submissions with Quadratic Voting validation.
 * Validates budget constraints server-side.
 * Rate limited: 10 requests/minute per user.
 */
export const POST = withRateLimit(
  voteLimiter,
  withAuth(['fan'], async (request: NextRequest, user: AuthenticatedUser) => {
    const body: unknown = await request.json()
    const parsed = fanVoteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const fanVotesForValidation = parsed.data.votes.map(v => ({
      trackId: v.trackId,
      votes: v.votes,
      creditsSpent: calculateQuadraticCost(v.votes),
    }))

    const { valid, totalCredits } = validateFanVotes(fanVotesForValidation)

    if (!valid) {
      return NextResponse.json(
        { error: `Credit budget exceeded: ${totalCredits} > ${MONTHLY_CREDIT_BUDGET}` },
        { status: 422 },
      )
    }

    return NextResponse.json({ success: true, totalCreditsSpent: totalCredits, userId: user.id })
  }),
  (req) => getRateLimitKey(req),
)
