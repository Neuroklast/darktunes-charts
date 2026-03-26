import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateSchulzeMethod } from '@/domain/voting/schulze'

const djBallotRequestSchema = z.object({
  periodId: z.string().uuid(),
  genre: z.string(),
  rankings: z.array(z.string().uuid()).min(1).max(100),
  candidates: z.array(z.string().uuid()).min(1).max(100),
})

/**
 * POST /api/votes/dj
 * Accepts DJ ranked-choice ballot submissions.
 * Validates and triggers Schulze calculation.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = djBallotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { rankings, candidates } = parsed.data
    const schulzeResult = calculateSchulzeMethod(candidates, [
      { djId: user.id, rankings },
    ])

    return NextResponse.json({ success: true, schulzeResult })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
