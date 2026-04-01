import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { voteRepository } from '@/infrastructure/repositories/voteRepository'
import { votingPeriodRepository } from '@/infrastructure/repositories/votingPeriodRepository'

/**
 * GET /api/votes/my-ballots
 *
 * Returns the current DJ's submitted ballots for the active voting period.
 *
 * Auth: requires authenticated user
 * Returns: { ballots, periodId }
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
        ballots: [],
        periodId: null,
        message: 'No active voting period',
      })
    }

    const ballots = await voteRepository.getUserBallotsForPeriod(user.id, activePeriod.id)

    return NextResponse.json({ ballots, periodId: activePeriod.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
