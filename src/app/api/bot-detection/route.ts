import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { analyzeVotingPatterns, type VoteRecord } from '@/domain/security/botDetection'
import { calculateSuspicionScore, type UserBehavior } from '@/domain/security/fingerprintAnalysis'
import { requireRole, withCORS } from '@/lib/auth/rbac'

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

/** Discriminated union for POST body type discrimination. */
const analyzeBodySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('behavior'), data: analyzeFingerprintSchema }),
  z.object({ type: z.literal('votes'), data: z.array(z.unknown()) }),
])

/**
 * GET /api/bot-detection
 * Returns bot detection alerts.
 *
 * Authorization: Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireRole(request, ['admin'])
    if (!authResult.success) {
      return authResult.response
    }

    // In production: fetch vote records from DB and run pattern analysis
    // const votes = await prisma.voteRecord.findMany({ orderBy: { timestamp: 'desc' }, take: 1000 })
    // const alerts = analyzeVotingPatterns(votes as VoteRecord[])
    const alerts = analyzeVotingPatterns([])
    return withCORS(NextResponse.json({ alerts }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}

/**
 * PUT /api/bot-detection
 * Updates a bot detection alert status.
 *
 * Authorization: Requires admin role
 */
export async function PUT(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireRole(request, ['admin'])
    if (!authResult.success) {
      return authResult.response
    }

    const body: unknown = await request.json()
    const parsed = updateAlertSchema.safeParse(body)

    if (!parsed.success) {
      return withCORS(NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      ))
    }

    return withCORS(NextResponse.json({ success: true }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}

/**
 * POST /api/bot-detection
 * Analyses a batch of vote records or a user behaviour fingerprint.
 *
 * Body format A (fingerprint analysis):
 *   { type: "behavior", data: UserBehavior }
 *
 * Body format B (pattern analysis):
 *   { type: "votes", data: VoteRecord[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = analyzeBodySchema.safeParse(body)

    if (!parsed.success) {
      return withCORS(NextResponse.json(
        { error: 'Invalid request body — expected { type: "behavior"|"votes", data: ... }', details: parsed.error.flatten() },
        { status: 400 }
      ))
    }

    if (parsed.data.type === 'behavior') {
      const result = calculateSuspicionScore(parsed.data.data as UserBehavior)
      return withCORS(NextResponse.json(result))
    }

    const alerts = analyzeVotingPatterns(parsed.data.data as VoteRecord[])
    return withCORS(NextResponse.json({ alerts }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}
