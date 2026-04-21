/**
 * POST /api/ad-slots/book
 * Creates a weekly sponsored placement booking.
 * Access: BAND, LABEL, or ADMIN.
 *
 * Validates that startDate is a Monday 00:00:00 UTC boundary and that weekCount ≥ 1.
 * Creates a booking in RESERVED status and returns a Stripe Checkout URL.
 * The booking becomes ACTIVE only after the Stripe webhook confirms payment.
 *
 * See docs/adr/ADR-004-monetization-foundations.md for week boundary rules.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { BookAdSlotSchema, validateWeeklyBooking } from '@/domain/adslots'
import { createCheckoutSession } from '@/infrastructure/payment/stripeAdapter'
import type { Tier } from '@/lib/types'

export const POST = withAuth(['BAND', 'LABEL', 'ADMIN'], async (request: NextRequest, _user) => {
  const body: unknown = await request.json()
  const parsed = BookAdSlotSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { adSlotId, bandId, startDate: startDateStr, weekCount, headline, assetUrl } = parsed.data
  const startDate = new Date(startDateStr)

  // Domain validation: week boundary + duration
  const validation = validateWeeklyBooking(startDate, weekCount)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  const endDate = validation.endDate!

  const prismaTyped = prisma as unknown as {
    adSlot: {
      findUnique: (args: unknown) => Promise<{ id: string; isAvailable: boolean; priceEur: number; slotType: string; maxBookings: number } | null>
    }
    adBooking: {
      create: (args: unknown) => Promise<{ id: string; status: string; startDate: Date; endDate: Date }>
      count: (args: unknown) => Promise<number>
    }
  }

  const slot = await prismaTyped.adSlot.findUnique({ where: { id: adSlotId } })
  if (!slot) {
    return NextResponse.json({ error: 'Ad slot not found' }, { status: 404 })
  }
  if (!slot.isAvailable) {
    return NextResponse.json({ error: 'Ad slot is not available' }, { status: 409 })
  }

  // Check concurrent bookings for this slot's week range
  const existingCount = await prismaTyped.adBooking.count({
    where: {
      adSlotId,
      status: { in: ['RESERVED', 'PENDING_PAYMENT', 'ACTIVE'] } as unknown as never,
      startDate: { lte: endDate } as unknown as never,
      endDate: { gte: startDate } as unknown as never,
    } as unknown as never,
  })

  if (existingCount >= slot.maxBookings) {
    return NextResponse.json({ error: 'Ad slot is fully booked for this period' }, { status: 409 })
  }

  const booking = await prismaTyped.adBooking.create({
    data: {
      adSlotId,
      bandId,
      startDate,
      endDate,
      weekCount,
      status: 'RESERVED',
      headline: headline ?? null,
      assetUrl: assetUrl ?? null,
    },
  })

  // Initiate Stripe Checkout
  try {
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://darktunes.com'
    const session = await createCheckoutSession({
      bandId,
      tier: 'Micro' as Tier,
      totalCategories: weekCount + 1,
      successUrl: `${origin}/dashboard/band?payment=success&bookingId=${booking.id}`,
      cancelUrl: `${origin}/dashboard/band?payment=cancelled`,
    })
    await prismaTyped.adBooking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.sessionId, status: 'PENDING_PAYMENT' },
    })
    return NextResponse.json({ booking, checkoutUrl: session.sessionUrl }, { status: 201 })
  } catch {
    // Stripe unavailable — return reserved booking without checkout URL
    return NextResponse.json(
      {
        booking,
        message: 'Booking reserved. Stripe Checkout unavailable, please contact support.',
      },
      { status: 201 },
    )
  }
})
