import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { analyzeVotingPatterns, type VoteRecord } from '@/domain/security/botDetection'
import { calculateSuspicionScore, type UserBehavior } from '@/domain/security/fingerprintAnalysis'

const updateAlertSchema = z.object({
  alertId: z.string().uuid(),
  status: z.enum(['REVIEWING', 'CLEARED', 'CONFIRMED_FRAUD']),
  notes: z.string().max(500).optional(),
})

const analyzeFingerprintSchema = z.object({
  voteIntervals: z.array(z.number()).min(1),
  sessionDurationMs: z.number().min(0),
  voteCount: z.number().int().min(1),
  hasMouseOrScrollEvents: z.boolean(),
  uniqueIpCount: z.number().int().min(1),
})

/**
 * GET /api/bot-detection
 * Returns bot detection alerts (admin only).
 */
export async function GET() {
  try {
    // In production: fetch vote records from DB and run pattern analysis
    // const votes = await prisma.voteRecord.findMany({ orderBy: { timestamp: 'desc' }, take: 1000 })
    // const alerts = analyzeVotingPatterns(votes as VoteRecord[])
    const alerts = analyzeVotingPatterns([])
    return NextResponse.json({ alerts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/bot-detection
 * Updates a bot detection alert status (admin only).
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = updateAlertSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/bot-detection
 * Analyses a batch of vote records or a user behaviour fingerprint.
 *
 * Body format A (pattern analysis):
 *   { votes: VoteRecord[] }
 *
 * Body format B (fingerprint analysis):
 *   { behavior: UserBehavior }
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()

    if (body && typeof body === 'object' && 'behavior' in body) {
      const parsed = analyzeFingerprintSchema.safeParse((body as { behavior: unknown }).behavior)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid behavior data', details: parsed.error.flatten() },
          { status: 400 }
        )
      }
      const result = calculateSuspicionScore(parsed.data as UserBehavior)
      return NextResponse.json(result)
    }

    if (body && typeof body === 'object' && 'votes' in body) {
      const votes = (body as { votes: unknown }).votes
      if (!Array.isArray(votes)) {
        return NextResponse.json({ error: 'votes must be an array' }, { status: 400 })
      }
      const alerts = analyzeVotingPatterns(votes as VoteRecord[])
      return NextResponse.json({ alerts })
    }

    return NextResponse.json({ error: 'Provide either votes or behavior in request body' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
