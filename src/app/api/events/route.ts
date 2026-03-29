import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { rankEvents, filterUpcomingEvents } from '@/domain/events/ranking'
import { requireRole, withCORS } from '@/lib/auth/rbac'

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  venue: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  date: z.string().datetime(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
})

/**
 * GET /api/events
 * Returns upcoming events ranked by intent count.
 */
export async function GET() {
  try {
    // In production, load events with intent counts:
    // const events = await prisma.event.findMany({ include: { _count: { select: { intents: true } } } })
    const mockEvents = filterUpcomingEvents([])
    const ranked = rankEvents(mockEvents)
    return withCORS(NextResponse.json({ events: ranked }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}

/**
 * POST /api/events
 * Creates a new event.
 *
 * Authorization: Requires admin or editor role
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin or editor role
    const authResult = await requireRole(request, ['admin', 'editor'])
    if (!authResult.success) {
      return authResult.response
    }

    const body: unknown = await request.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return withCORS(NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      ))
    }

    return withCORS(NextResponse.json({ success: true, event: { id: 'new-event-id', intentCount: 0, ...parsed.data } }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}
