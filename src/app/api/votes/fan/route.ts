import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateQuadraticCost, validateFanVotes, MONTHLY_CREDIT_BUDGET } from '@/domain/voting/quadratic'

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
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = fanVoteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
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
        { status: 422 }
      )
    }

    return NextResponse.json({ success: true, totalCreditsSpent: totalCredits })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
