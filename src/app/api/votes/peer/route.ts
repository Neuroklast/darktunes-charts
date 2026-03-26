import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateCliqueCoefficient } from '@/domain/voting/peer'

const peerVoteRequestSchema = z.object({
  votedBandId: z.string().uuid(),
  periodId: z.string().uuid(),
  rawWeight: z.number().min(0).max(1).default(1.0),
})

/**
 * POST /api/votes/peer
 * Accepts band peer vote submissions with clique detection.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = peerVoteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
