/**
 * GET /api/ads/slots
 *
 * Returns slot availability for a given date range (public endpoint).
 *
 * Query params:
 *   - startDate (required): ISO 8601 date
 *   - endDate (required): ISO 8601 date
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_MAX_CONCURRENT,
  SLOT_PRICES_EUR_CENTS,
  getAvailableSlotCount,
  type AdSlotType,
  type AdBookingStatus,
} from '@/domain/ads'

const QuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const ALL_SLOT_TYPES: AdSlotType[] = [
  'HOME_HERO',
  'HOME_SIDEBAR',
  'GENRE_BANNER',
  'NEW_AND_HOT_LIST',
]

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const raw = {
    startDate: url.searchParams.get('startDate') ?? '',
    endDate: url.searchParams.get('endDate') ?? '',
  }

  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'startDate and endDate are required (YYYY-MM-DD format)' },
      { status: 400 },
    )
  }

  const { startDate, endDate } = parsed.data

  try {
    // Fetch existing bookings in the date range
    const existingBookings = await (prisma as unknown as {
      adBooking: {
        findMany: (args: {
          where: {
            status: { in: string[] }
            startDate: { lte: Date }
            endDate: { gte: Date }
          }
          select: {
            slotType: boolean
            startDate: boolean
            endDate: boolean
            status: boolean
          }
        }) => Promise<Array<{ slotType: string; startDate: Date; endDate: Date; status: string }>>
      }
    }).adBooking.findMany({
      where: {
        status: { in: ['RESERVED', 'PAID', 'ACTIVE'] },
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
      select: { slotType: true, startDate: true, endDate: true, status: true },
    })

    // Group by slot type
    const bookingsBySlot = new Map<AdSlotType, Array<{ startDate: string; endDate: string; status: AdBookingStatus }>>()
    for (const booking of existingBookings) {
      const slotType = booking.slotType as AdSlotType
      const existing = bookingsBySlot.get(slotType) ?? []
      existing.push({
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        status: booking.status as AdBookingStatus,
      })
      bookingsBySlot.set(slotType, existing)
    }

    const slots = ALL_SLOT_TYPES.map(slotType => {
      const maxConcurrent = DEFAULT_MAX_CONCURRENT[slotType]
      const bookings = bookingsBySlot.get(slotType) ?? []
      const availableCount = getAvailableSlotCount(bookings, maxConcurrent, startDate, endDate)

      return {
        slotType,
        maxConcurrent,
        availableCount,
        pricePerDayEurCents: SLOT_PRICES_EUR_CENTS[slotType],
        isAvailable: availableCount > 0,
      }
    })

    return NextResponse.json({ slots, requestedRange: { startDate, endDate } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
