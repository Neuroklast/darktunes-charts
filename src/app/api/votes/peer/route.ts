import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { calculateCliqueCoefficient } from '@/domain/voting/peer'
import { withAuth, type AuthenticatedUser } from '@/infrastructure/security/rbac'
import { createRateLimiter, withRateLimit, getRateLimitKey } from '@/infrastructure/security/rateLimiter'
import { VOTE_RATE_LIMIT } from '@/infrastructure/security/rateLimitConfig'

const voteLimiter = createRateLimiter(VOTE_RATE_LIMIT)

const peerVoteRequestSchema = z.object({
  votedBandId: z.string().uuid(),
  periodId: z.string().uuid(),
  rawWeight: z.number().min(0).max(1).default(1.0),
})

/**
 * POST /api/votes/peer
 * Accepts band peer vote submissions with clique detection.
 * Rate limited: 10 requests/minute per user.
 */
export const POST = withRateLimit(
  voteLimiter,
  withAuth(['band'], async (request: NextRequest, user: AuthenticatedUser) => {
    const body: unknown = await request.json()
    const parsed = peerVoteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    if (parsed.data.votedBandId === user.id) {
      return NextResponse.json({ error: 'Bands cannot vote for themselves' }, { status: 422 })
    }

    // In production, load allBandVotes from the database
    const allBandVotes = new Map<string, string[]>()
    const cliqueCoeff = calculateCliqueCoefficient(user.id, parsed.data.votedBandId, allBandVotes)
    const finalWeight = parsed.data.rawWeight * cliqueCoeff

    return NextResponse.json({ success: true, cliqueCoefficient: cliqueCoeff, finalWeight })
  }),
  (req) => getRateLimitKey(req),
)
