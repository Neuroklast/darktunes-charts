import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateSchulzeMethod } from '@/domain/voting/schulze'
import { voteRepository } from '@/infrastructure/repositories/voteRepository'
import { votingPeriodRepository } from '@/infrastructure/repositories/votingPeriodRepository'
import { createAuditLog } from '@/infrastructure/audit'
import { rateLimiter, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS } from '@/infrastructure/rateLimiter'

const djBallotRequestSchema = z.object({
  periodId: z.string().uuid(),
  genre: z.string(),
  rankings: z.array(z.string().uuid()).min(1).max(100),
  candidates: z.array(z.string().uuid()).min(1).max(100),
  /** Phase 2 field — optional alias for `genre`. */
  categoryId: z.string().optional(),
})

/**
 * POST /api/votes/dj
 *
 * Accepts DJ ranked-choice ballot submissions.
 * Validates and triggers Schulze calculation. Persists ballot when
 * categoryId is provided (Phase 2 format).
 *
 * Body: { periodId, genre, rankings, candidates, categoryId? }
 * Returns: { success, schulzeResult }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: max 60 requests/minute per user
    const rateCheck = rateLimiter.check(user.id, 'dj-ballots', VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before submitting another ballot.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) },
        },
      )
    }

    const body: unknown = await request.json()
    const parsed = djBallotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { rankings, candidates, periodId, genre, categoryId } = parsed.data
    const effectiveCategoryId = categoryId ?? genre

    const schulzeResult = calculateSchulzeMethod(candidates, [
      { djId: user.id, rankings },
    ])

    // Persist ballot when categoryId/genre is provided (Phase 2)
    if (effectiveCategoryId) {
      try {
        const activePeriod = periodId
          ? { id: periodId }
          : await votingPeriodRepository.findActive()

        if (activePeriod) {
          const ballot = await voteRepository.createDJBallot({
            userId: user.id,
            categoryId: effectiveCategoryId,
            periodId: activePeriod.id,
            rankings,
          })

          await createAuditLog('dj_ballot_submitted', 'DJBallot', ballot.id, user.id, {
            categoryId: effectiveCategoryId,
            rankingsCount: rankings.length,
          })
        }
      } catch (dbError) {
        if (dbError instanceof Error && dbError.message.includes('already submitted')) {
          return NextResponse.json(
            { error: dbError.message },
            { status: 409 },
          )
        }
        console.error('[POST /api/votes/dj] DB persistence error:', dbError)
        // Fall through to return schulze result
      }
    }

    return NextResponse.json({ success: true, schulzeResult })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
