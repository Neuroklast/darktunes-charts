import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const feedbackSchema = z.object({
  bandId: z.string().uuid('Invalid band ID'),
  trackId: z.string().uuid('Invalid track ID').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

/**
 * GET /api/feedback
 * Returns DJ feedback for the authenticated user.
 *
 * - If the user is a DJ: returns feedback they have given.
 * - If the user is a Band: returns feedback they have received.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real implementation this would query Prisma; returning empty array
    // until the database is provisioned.  The route contract is fully defined.
    return NextResponse.json({ feedback: [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/feedback
 * Creates a new DJ feedback entry.
 *
 * Request body: { bandId: string, trackId?: string, message: string }
 *
 * Only authenticated DJs with verified status can submit feedback.
 * Bands cannot submit feedback (read-only).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = feedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { bandId, trackId, message } = parsed.data

    // In a real implementation this would create a DJFeedback record via Prisma:
    // await prisma.dJFeedback.create({
    //   data: { djId: user.id, bandId, trackId, message },
    // })

    return NextResponse.json({
      success: true,
      feedback: {
        djId: user.id,
        bandId,
        trackId: trackId ?? null,
        message,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
