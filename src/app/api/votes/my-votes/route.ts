import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { voteRepository } from '@/infrastructure/repositories/voteRepository'
import { votingPeriodRepository } from '@/infrastructure/repositories/votingPeriodRepository'

/**
 * GET /api/votes/my-votes
 *
 * Returns the current fan's votes for the active voting period,
 * including remaining credit balance.
 *
 * Auth: requires authenticated user
 * Returns: { votes, remainingCredits, periodId }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activePeriod = await votingPeriodRepository.findActive()

    if (!activePeriod) {
      return NextResponse.json({
        votes: [],
        remainingCredits: 150,
        periodId: null,
        message: 'No active voting period',
      })
    }

    const [votes, remainingCredits] = await Promise.all([
      voteRepository.getUserVotesForPeriod(user.id, activePeriod.id),
      voteRepository.getRemainingCredits(user.id, activePeriod.id),
    ])

    return NextResponse.json({ votes, remainingCredits, periodId: activePeriod.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
