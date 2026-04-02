/**
 * GET /api/ad-slots/active
 * Returns all currently active sponsored placements.
 * Public endpoint — no authentication required.
 *
 * All returned bookings are ACTIVE, meaning payment has been confirmed.
 * The response is used by the UI to display sponsored "Neu & Hot" placements,
 * which must be clearly labelled as "Sponsored" in the UI.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()

  const prismaTyped = prisma as unknown as {
    adBooking: {
      findMany: (args: unknown) => Promise<Array<{
        id: string
        bandId: string
        startDate: Date
        endDate: Date
        weekCount: number
        headline: string | null
        assetUrl: string | null
        adSlot: { slotType: string }
        band: { id: string; name: string; slug: string | null }
      }>>
    }
  }

  const bookings = await prismaTyped.adBooking.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: now } as unknown as never,
      endDate: { gt: now } as unknown as never,
    } as unknown as never,
    include: {
      adSlot: { select: { slotType: true } },
      band: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { startDate: 'asc' } as unknown as never,
  })

  return NextResponse.json({ sponsored: bookings, _note: 'All placements are paid sponsorships and do not affect chart rankings.' })
}
