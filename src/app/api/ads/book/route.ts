/**
 * POST /api/ads/book
 *
 * Creates an ad booking reservation and initiates a Stripe checkout session.
 *
 * Flow:
 *   1. Validate request
 *   2. Check slot availability (double-booking prevention)
 *   3. Create AdBooking with status RESERVED
 *   4. Create Stripe checkout session
 *   5. Update booking with stripeCheckoutSessionId
 *   6. Return checkout URL
 *
 * On Stripe webhook confirmation → booking status moves to PAID/ACTIVE.
 *
 * Access: BAND or LABEL role.
 * All booking creations are audit logged (ADR-018).
 */

import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import {
  validateAdBooking,
  calculateBookingDays,
  calculateBookingCost,
  checkSlotAvailability,
  DEFAULT_MAX_CONCURRENT,
  type AdSlotType,
  type AdBookingStatus,
} from '@/domain/ads'
import { rateLimiter } from '@/infrastructure/rateLimiter'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })
}

const BOOK_RATE_LIMIT = 5
const BOOK_RATE_WINDOW_MS = 60 * 60 * 1000

export const POST = withAuth(
  ['BAND', 'LABEL'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const { allowed } = rateLimiter.check(user.id, 'ads-book', BOOK_RATE_LIMIT, BOOK_RATE_WINDOW_MS)
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    try {
      const body: unknown = await request.json()
      const data = validateAdBooking(body)

      // Calculate booking duration and cost
      let days: number
      try {
        days = calculateBookingDays(data.startDate, data.endDate)
      } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid dates' }, { status: 400 })
      }

      const totalCostCents = calculateBookingCost(data.slotType as AdSlotType, days)

      // Check slot availability
      const existingBookings = await (prisma as unknown as {
        adBooking: {
          findMany: (args: {
            where: {
              slotType: string
              status: { in: string[] }
              startDate: { lte: Date }
              endDate: { gte: Date }
            }
            select: { startDate: boolean; endDate: boolean; status: boolean }
          }) => Promise<Array<{ startDate: Date; endDate: Date; status: string }>>
        }
      }).adBooking.findMany({
        where: {
          slotType: data.slotType,
          status: { in: ['RESERVED', 'PAID', 'ACTIVE'] },
          startDate: { lte: new Date(data.endDate) },
          endDate: { gte: new Date(data.startDate) },
        },
        select: { startDate: true, endDate: true, status: true },
      })

      const bookingsForCheck = existingBookings.map(b => ({
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        status: b.status as AdBookingStatus,
      }))

      const maxConcurrent = DEFAULT_MAX_CONCURRENT[data.slotType as AdSlotType]
      const isAvailable = checkSlotAvailability(
        bookingsForCheck,
        maxConcurrent,
        data.startDate,
        data.endDate,
      )

      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Slot fully booked for the requested date range' },
          { status: 409 },
        )
      }

      // Create RESERVED booking
      const booking = await (prisma as unknown as {
        adBooking: {
          create: (args: {
            data: {
              slotType: string
              bandId?: string
              labelId?: string
              startDate: Date
              endDate: Date
              status: string
              creative: unknown
            }
            select: { id: boolean }
          }) => Promise<{ id: string }>
        }
      }).adBooking.create({
        data: {
          slotType: data.slotType,
          bandId: data.bandId,
          labelId: data.labelId ?? (user.role === 'LABEL' ? user.id : undefined),
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: 'RESERVED',
          creative: data.creative,
        },
        select: { id: true },
      })

      // Create Stripe checkout session (skip in test env)
      let checkoutUrl = data.successUrl
      let sessionId: string | undefined

      if (process.env.NEXT_PUBLIC_APP_ENV !== 'test') {
        const stripe = getStripeClient()
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `DarkTunes Sponsored Slot: ${data.slotType} (${days} day(s))`,
                  description: `${data.creative.headline} — ${data.startDate} bis ${data.endDate}`,
                },
                unit_amount: totalCostCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            purpose: 'ad_booking',
            bookingId: booking.id,
            slotType: data.slotType,
            userId: user.id,
          },
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
        })

        if (!session.url) {
          throw new Error('Stripe did not return a checkout URL')
        }

        checkoutUrl = session.url
        sessionId = session.id

        // Update booking with Stripe session ID
        await (prisma as unknown as {
          adBooking: {
            update: (args: {
              where: { id: string }
              data: { stripeCheckoutSessionId: string }
            }) => Promise<unknown>
          }
        }).adBooking.update({
          where: { id: booking.id },
          data: { stripeCheckoutSessionId: session.id },
        })
      }

      // Audit log
      await (prisma as unknown as {
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId: string; metadata: unknown } }) => Promise<unknown>
        }
      }).auditLog.create({
        data: {
          action: 'ad_booking_reserved',
          entityType: 'ad_booking',
          entityId: booking.id,
          userId: user.id,
          metadata: { slotType: data.slotType, days, totalCostCents, stripeSessionId: sessionId },
        },
      })

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        checkoutUrl,
        totalCostCents,
        days,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      const status = message.startsWith('Invalid ad booking') ? 400 : 500
      return NextResponse.json({ error: message }, { status })
    }
  },
)
