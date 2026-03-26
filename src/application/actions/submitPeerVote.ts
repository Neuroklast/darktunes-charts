'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateCliqueCoefficient } from '@/domain/voting/peer'

const peerVoteSchema = z.object({
  votedBandId: z.string().uuid(),
  periodId: z.string().uuid(),
  rawWeight: z.number().min(0).max(1).default(1.0),
})

export type PeerVoteInput = z.infer<typeof peerVoteSchema>

export interface SubmitPeerVoteResult {
  success: boolean
  error?: string
  cliqueCoefficient?: number
  finalWeight?: number
}

/**
 * Server Action: Submits a band peer vote with clique-coefficient calculation.
 *
 * Validates:
 * 1. User is authenticated and has a band account.
 * 2. Band is not voting for itself.
 * 3. Vote passes Zod schema validation.
 *
 * Calculates the clique coefficient to detect reciprocal voting rings.
 *
 * @param vote - The peer vote input.
 * @param allBandVotes - Existing vote map for clique detection.
 * @returns Success/failure with calculated weight information.
 */
export async function submitPeerVote(
  vote: PeerVoteInput,
  allBandVotes: Map<string, string[]>
): Promise<SubmitPeerVoteResult> {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // 2. Input validation
    const parsed = peerVoteSchema.safeParse(vote)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige Vote-Daten: ' + parsed.error.message }
    }

    // 3. Self-vote check (bandId is the user's band ID)
    if (parsed.data.votedBandId === user.id) {
      return { success: false, error: 'Bands können nicht für sich selbst stimmen' }
    }

    // 4. Calculate clique coefficient
    const cliqueCoeff = calculateCliqueCoefficient(
      user.id,
      parsed.data.votedBandId,
      allBandVotes
    )

    const finalWeight = parsed.data.rawWeight * cliqueCoeff

    revalidatePath('/charts')
    revalidatePath('/dashboard/band')

    return {
      success: true,
      cliqueCoefficient: cliqueCoeff,
      finalWeight,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
