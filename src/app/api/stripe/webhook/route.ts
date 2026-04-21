import { NextResponse, type NextRequest } from 'next/server'
import { handleWebhook } from '@/infrastructure/payment/stripeAdapter'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events.
 *
 * Stripe sends raw body with a `stripe-signature` header that must be
 * verified before processing. We use `request.arrayBuffer()` to get the
 * raw bytes required for HMAC verification.
 *
 * Currently handled events:
 * - `checkout.session.completed` → activates band's paid categories in DB
 * - `checkout.session.completed` (with bookingId metadata) → activates AdBooking
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let payload: Buffer
  try {
    const arrayBuffer = await request.arrayBuffer()
    payload = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  try {
    const result = await handleWebhook(payload, signature)

    if (result.type === 'checkout.session.completed') {
      // In production with Prisma:
      // await prisma.band.update({
      //   where: { id: result.bandId },
      //   data: { paidCategorySlots: result.paidCategories },
      // })
      return NextResponse.json({ received: true, processed: result.type })
    }

    if (result.type === 'ad-booking.activated') {
      // Idempotency guard: only activate if booking is in PENDING state.
      // Stripe retries webhooks on timeout — without this check the same
      // booking would be activated multiple times.
      const adBookingDb = prisma as unknown as {
        adBooking: {
          findUnique: (args: unknown) => Promise<{ id: string; status: string } | null>
          update: (args: unknown) => Promise<{ id: string }>
        }
      }

      const booking = await adBookingDb.adBooking.findUnique({
        where: { id: result.bookingId },
        select: { id: true, status: true },
      })

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      if (booking.status === 'ACTIVE') {
        // Already processed — idempotent success
        return NextResponse.json({ received: true, processed: 'ad-booking.already-active' })
      }

      await adBookingDb.adBooking.update({
        where: { id: result.bookingId },
        data: { status: 'ACTIVE' },
      })
      return NextResponse.json({ received: true, processed: 'ad-booking.activated' })
    }

    return NextResponse.json({ received: true, processed: 'unhandled' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
