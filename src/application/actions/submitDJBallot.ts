'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateSchulzeMethod } from '@/domain/voting/schulze'

const djBallotSchema = z.object({
  periodId: z.string().uuid(),
  genre: z.enum(['GOTH', 'METAL', 'DARK_ELECTRO', 'POST_PUNK', 'INDUSTRIAL', 'DARKWAVE', 'EBM', 'SYMPHONIC_METAL', 'AGGROTECH', 'NEOFOLK']),
  rankings: z.array(z.string().uuid()).min(1).max(100),
  candidates: z.array(z.string().uuid()).min(1).max(100),
})

export type DJBallotInput = z.infer<typeof djBallotSchema>

export interface SubmitDJBallotResult {
  success: boolean
  error?: string
  schulzeResult?: ReturnType<typeof calculateSchulzeMethod>
}

/**
 * Server Action: Submits a DJ ranked-choice ballot and triggers Schulze calculation.
 *
 * Validates:
 * 1. User is authenticated and DJ-verified.
 * 2. Input schema is valid.
 * 3. All ranked tracks are in the candidates list.
 *
 * @param ballot - The DJ's ranked ballot input.
 * @returns Success/failure with optional Schulze calculation result.
 */
export async function submitDJBallot(ballot: DJBallotInput): Promise<SubmitDJBallotResult> {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // 2. Input validation
    const parsed = djBallotSchema.safeParse(ballot)
    if (!parsed.success) {
      return { success: false, error: 'Ungültige Ballot-Daten: ' + parsed.error.message }
    }

    const { rankings, candidates } = parsed.data

    // 3. Validate all ranked tracks are valid candidates
    const candidateSet = new Set(candidates)
    const invalidTracks = rankings.filter(id => !candidateSet.has(id))
    if (invalidTracks.length > 0) {
      return { success: false, error: `Ungültige Track-IDs: ${invalidTracks.join(', ')}` }
    }

    // 4. Run Schulze calculation with this ballot
    const schulzeResult = calculateSchulzeMethod(candidates, [
      { djId: user.id, rankings },
    ])

    revalidatePath('/charts')
    revalidatePath('/dashboard/dj')

    return { success: true, schulzeResult }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
