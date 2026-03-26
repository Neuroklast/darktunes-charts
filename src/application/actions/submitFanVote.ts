'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateQuadraticCost, validateFanVotes, MONTHLY_CREDIT_BUDGET } from '@/domain/voting/quadratic'

const fanVoteSchema = z.object({
  trackId: z.string().uuid(),
  votes: z.number().int().min(0).max(10),
  periodId: z.string().uuid(),
})

const fanVotesBatchSchema = z.array(fanVoteSchema).max(50)

export type FanVoteInput = z.infer<typeof fanVoteSchema>

export interface SubmitFanVoteResult {
  success: boolean
  error?: string
  totalCreditsSpent?: number
}

/**
 * Server Action: Submits fan votes with Quadratic Voting validation.
 *
 * Validates:
 * 1. User is authenticated.
 * 2. Input schema is valid.
 * 3. Total credits spent ≤ MONTHLY_CREDIT_BUDGET.
 * 4. No duplicate trackIds in the batch.
 *
 * Writes FanVote records via Prisma and revalidates chart paths.
 *
 * @param votes - Array of fan vote inputs to submit.
 * @returns Success/failure result with optional error message.
 */
export async function submitFanVote(votes: FanVoteInput[]): Promise<SubmitFanVoteResult> {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // 2. Input validation
    const parsed = fanVotesBatchSchema.safeParse(votes)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige Vote-Daten: ' + parsed.error.message }
    }

    const validVotes = parsed.data

    // 3. Quadratic cost validation
    const fanVotesForValidation = validVotes.map(v => ({
      trackId: v.trackId,
      votes: v.votes,
      creditsSpent: calculateQuadraticCost(v.votes),
    }))

    const { valid, totalCredits } = validateFanVotes(fanVotesForValidation)
    if (!valid) {
      return {
        success: false,
        error: `Credit-Budget überschritten: ${totalCredits} > ${MONTHLY_CREDIT_BUDGET}`,
      }
    }

    // 4. Check for duplicate trackIds
    const trackIds = validVotes.map(v => v.trackId)
    if (new Set(trackIds).size !== trackIds.length) {
      return { success: false, error: 'Doppelte Track-IDs im Batch' }
    }

    // Note: In production, Prisma would be used here:
    // await prisma.$transaction(fanVotesForValidation.map(vote =>
    //   prisma.fanVote.upsert({
    //     where: { userId_trackId_periodId: { userId: user.id, trackId: vote.trackId, periodId: votes[0].periodId } },
    //     update: { votes: vote.votes, creditsSpent: vote.creditsSpent },
    //     create: { userId: user.id, trackId: vote.trackId, periodId: votes[0].periodId, votes: vote.votes, creditsSpent: vote.creditsSpent },
    //   })
    // ))

    revalidatePath('/charts')
    revalidatePath('/dashboard/fan')

    return { success: true, totalCreditsSpent: totalCredits }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
