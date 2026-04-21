import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type TransparencyDb = {
  transparencyLogEntry: {
    findMany: (args: unknown) => Promise<Array<{
      id: string
      timestamp: Date
      trackId: string
      userId: string
      voteType: string
      rawVotes: number
      creditsSpent: number | null
      weight: number
      finalContribution: number
      reason: string | null
    }>>
    create: (args: unknown) => Promise<{
      id: string
      timestamp: Date
      trackId: string
      userId: string
      voteType: string
      rawVotes: number
      creditsSpent: number | null
      weight: number
      finalContribution: number
      reason: string | null
    }>
  }
}

const createLogEntrySchema = z.object({
  trackId: z.string().uuid(),
  voteType: z.enum(['FAN', 'DJ', 'PEER']),
  rawVotes: z.number().int().min(0),
  creditsSpent: z.number().optional(),
  weight: z.number().min(0).max(1),
  finalContribution: z.number(),
  reason: z.string().max(500).optional(),
})

/**
 * GET /api/transparency
 * Returns the transparency log entries.
 */
export async function GET(request: NextRequest) {
  try {
    const trackId = request.nextUrl.searchParams.get('trackId')
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10), 200)
    const db = prisma as unknown as TransparencyDb
    const logs = await db.transparencyLogEntry.findMany({
      where: trackId ? { trackId } : undefined,
      take: limit,
      orderBy: { timestamp: 'desc' },
    })
    return NextResponse.json({ logs, trackId, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/transparency
 * Creates a new transparency log entry.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = createLogEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const db = prisma as unknown as TransparencyDb
    const logEntry = await db.transparencyLogEntry.create({
      data: {
        trackId: parsed.data.trackId,
        userId: user.id,
        voteType: parsed.data.voteType,
        rawVotes: parsed.data.rawVotes,
        creditsSpent: parsed.data.creditsSpent ?? null,
        weight: parsed.data.weight,
        finalContribution: parsed.data.finalContribution,
        reason: parsed.data.reason ?? null,
      },
    })
    return NextResponse.json({ success: true, logEntry })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
