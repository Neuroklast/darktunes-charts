import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const updateAlertSchema = z.object({
  alertId: z.string().uuid(),
  status: z.enum(['REVIEWING', 'CLEARED', 'CONFIRMED_FRAUD']),
  notes: z.string().max(500).optional(),
})

/**
 * GET /api/bot-detection
 * Returns bot detection alerts (admin only).
 */
export async function GET() {
  try {
    // In production: const alerts = await prisma.botDetectionAlert.findMany({ where: { status: 'FLAGGED' }, orderBy: { timestamp: 'desc' } })
    return NextResponse.json({ alerts: [] })
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
