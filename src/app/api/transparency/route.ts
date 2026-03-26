import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

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
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10)
    // In production: const logs = await prisma.transparencyLogEntry.findMany({ where: trackId ? { trackId } : {}, take: limit, orderBy: { timestamp: 'desc' } })
    return NextResponse.json({ logs: [], trackId, limit })
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

    return NextResponse.json({ success: true, logEntry: { id: 'new-log-id', userId: user.id, timestamp: new Date().toISOString(), ...parsed.data } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
