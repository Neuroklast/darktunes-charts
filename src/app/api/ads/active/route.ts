/**
 * GET /api/ads/active
 *
 * Returns all currently active sponsored placements (public endpoint).
 *
 * All results are clearly labeled as sponsored (ADR-018).
 * This endpoint never returns chart rankings or chart positions.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date()

    const activeBookings = await (prisma as unknown as {
      adBooking: {
        findMany: (args: {
          where: {
            status: { in: string[] }
            startDate: { lte: Date }
            endDate: { gte: Date }
          }
          select: {
            id: boolean
            slotType: boolean
            bandId: boolean
            labelId: boolean
            startDate: boolean
            endDate: boolean
            creative: boolean
          }
          orderBy: { startDate: string }
        }) => Promise<Array<{
          id: string
          slotType: string
          bandId: string | null
          labelId: string | null
          startDate: Date
          endDate: Date
          creative: unknown
        }>>
      }
    }).adBooking.findMany({
      where: {
        status: { in: ['PAID', 'ACTIVE'] },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        slotType: true,
        bandId: true,
        labelId: true,
        startDate: true,
        endDate: true,
        creative: true,
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({
      /**
       * ADR-018: All items in this response are sponsored placements.
       * They must be displayed with a "Sponsored" label in the UI.
       * This list is SEPARATE from any chart rankings.
       */
      isSponsored: true,
      placements: activeBookings.map(booking => ({
        id: booking.id,
        slotType: booking.slotType,
        bandId: booking.bandId,
        labelId: booking.labelId,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        creative: booking.creative,
        /** Must always be true for UI rendering — no exceptions (ADR-018). */
        isSponsored: true,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
