import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { rankEvents, filterUpcomingEvents } from '@/domain/events/ranking'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

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
    const db = prisma as unknown as {
      event: {
        findMany: (args: unknown) => Promise<Array<{
          id: string; name: string; venue: string; city: string; country: string;
          date: Date; description: string | null; imageUrl: string | null;
          createdAt: Date; _count: { intents: number }
        }>>
      }
    }
    const rows = await db.event.findMany({
      include: { _count: { select: { intents: true } } },
      orderBy: { date: 'asc' },
    })
    const events = filterUpcomingEvents(
      rows.map(r => ({ ...r, date: r.date.toISOString(), intentCount: r._count.intents }))
    )
    const ranked = rankEvents(events)
    return NextResponse.json({ events: ranked })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/events
 * Creates a new event.
 *
 * Access control: Only ADMIN or EDITOR roles may create events.
 */
export const POST = withAuth(['ADMIN', 'EDITOR'], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = createEventSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const eventDb = prisma as unknown as {
    event: {
      create: (args: unknown) => Promise<{
        id: string; name: string; venue: string; city: string; country: string;
        date: Date; description: string | null; imageUrl: string | null
      }>
    }
  }
  const event = await eventDb.event.create({ data: { ...parsed.data, date: new Date(parsed.data.date) } })
  return NextResponse.json({ success: true, event: { ...event, date: event.date.toISOString(), intentCount: 0 } })
})
