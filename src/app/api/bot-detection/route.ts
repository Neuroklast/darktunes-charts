import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { analyzeVotingPatterns, type VoteRecord } from '@/domain/security/botDetection'
import { calculateSuspicionScore, type UserBehavior } from '@/domain/security/fingerprintAnalysis'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

type BotDetectionDb = {
  botDetectionAlert: {
    findMany: (args: unknown) => Promise<Array<{
      id: string; trackId: string; bandId: string; alertType: string; severity: string
      votesCount: number; timeWindow: number; suspiciousIPs: string[]
      newAccountRatio: number | null; status: string; timestamp: Date
      reviewedById: string | null; reviewedAt: Date | null
    }>>
    update: (args: unknown) => Promise<{ id: string }>
  }
}

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
 * Access control: ADMIN only.
 */
export const GET = withAuth(['ADMIN'], async () => {
  const db = prisma as unknown as BotDetectionDb
  const alerts = await db.botDetectionAlert.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  })
  return NextResponse.json({ alerts })
})

/**
 * PUT /api/bot-detection
 * Updates a bot detection alert status.
 *
 * Access control: ADMIN only.
 */
export const PUT = withAuth(['ADMIN'], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = updateAlertSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const db = prisma as unknown as BotDetectionDb
  await db.botDetectionAlert.update({
    where: { id: parsed.data.alertId },
    data: { status: parsed.data.status, reviewedAt: new Date() },
  })
  return NextResponse.json({ success: true })
})

/**
 * POST /api/bot-detection
 * Analyses a batch of vote records or a user behaviour fingerprint.
 *
 * Body format A (fingerprint analysis):
 *   { type: "behavior", data: UserBehavior }
 *
 * Body format B (pattern analysis):
 *   { type: "votes", data: VoteRecord[] }
 *
 * Access control: Any authenticated user.
 */
export const POST = withAuth([], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = analyzeBodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body — expected { type: "behavior"|"votes", data: ... }', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (parsed.data.type === 'behavior') {
    const result = calculateSuspicionScore(parsed.data.data as UserBehavior)
    return NextResponse.json(result)
  }

  const alerts = analyzeVotingPatterns(parsed.data.data as VoteRecord[])
  return NextResponse.json({ alerts })
})
