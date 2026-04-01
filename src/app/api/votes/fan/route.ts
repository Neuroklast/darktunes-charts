import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  calculateQuadraticCost,
  validateFanVotes,
  MONTHLY_CREDIT_BUDGET,
} from '@/domain/voting/quadratic'
import { voteRepository } from '@/infrastructure/repositories/voteRepository'
import { votingPeriodRepository } from '@/infrastructure/repositories/votingPeriodRepository'
import { createAuditLog } from '@/infrastructure/audit'
import { rateLimiter, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS } from '@/infrastructure/rateLimiter'

const fanVoteRequestSchema = z.object({
  votes: z.array(z.object({
    trackId: z.string().uuid(),
    votes: z.number().int().min(0).max(10),
    periodId: z.string().uuid(),
    /** Phase 2 fields — optional for backward compatibility. */
    releaseId: z.string().uuid().optional(),
    categoryId: z.string().optional(),
  })).max(50),
})

/**
 * POST /api/votes/fan
 *
 * Accepts fan vote submissions with Quadratic Voting validation.
 * Validates budget constraints server-side and persists valid votes to the DB.
 *
 * Body: { votes: [{ trackId, votes, periodId, releaseId?, categoryId? }] }
 * Returns: { success, totalCreditsSpent, remainingCredits }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: max 60 requests/minute per user
    const rateCheck = rateLimiter.check(user.id, 'fan-votes', VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before voting again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) },
        },
      )
    }

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

    // Persist votes when releaseId + categoryId are provided (Phase 2 format)
    const persistableVotes = parsed.data.votes.filter(
      (v) => v.releaseId && v.categoryId,
    )

    if (persistableVotes.length > 0) {
      try {
        // Resolve active period: use the period from the first vote, or look up the active one
        const firstVote = persistableVotes[0]
        const activePeriod = firstVote?.periodId
          ? { id: firstVote.periodId }
          : await votingPeriodRepository.findActive()

        if (activePeriod) {
          const remaining = await voteRepository.getRemainingCredits(user.id, activePeriod.id)

          if (totalCredits > remaining) {
            return NextResponse.json(
              { error: `Insufficient credits: need ${totalCredits}, have ${remaining}` },
              { status: 422 },
            )
          }

          for (const vote of persistableVotes) {
            if (!vote.releaseId || !vote.categoryId) continue
            const creditsSpent = calculateQuadraticCost(vote.votes)
            const fanVote = await voteRepository.createFanVote({
              userId: user.id,
              releaseId: vote.releaseId,
              categoryId: vote.categoryId,
              periodId: activePeriod.id,
              votes: vote.votes,
              creditsSpent,
            })

            await createAuditLog('fan_vote_submitted', 'FanVote', fanVote.id, user.id, {
              releaseId: vote.releaseId,
              categoryId: vote.categoryId,
              votes: vote.votes,
              creditsSpent,
            })
          }

          const updatedRemaining = await voteRepository.getRemainingCredits(
            user.id,
            activePeriod.id,
          )

          return NextResponse.json({
            success: true,
            totalCreditsSpent: totalCredits,
            remainingCredits: updatedRemaining,
          })
        }
      } catch (dbError) {
        console.error('[POST /api/votes/fan] DB persistence error:', dbError)
        // Fall through to non-persistent response
      }
    }

    return NextResponse.json({ success: true, totalCreditsSpent: totalCredits })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
