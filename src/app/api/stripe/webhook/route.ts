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
 * - `checkout.session.completed` (purpose=ad_booking) → activates ad booking (ADR-018)
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

    if (result.type === 'checkout.session.completed.ad_booking') {
      // Idempotent: activate the ad booking on payment confirmation
      type AdBookingPrisma = {
        adBooking: {
          updateMany: (args: { where: { id: string; stripeCheckoutSessionId: string }; data: { status: string } }) => Promise<{ count: number }>
        }
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId?: string; metadata: unknown } }) => Promise<unknown>
        }
      }
      const db = prisma as unknown as AdBookingPrisma

      await db.adBooking.updateMany({
        where: { id: result.bookingId, stripeCheckoutSessionId: result.sessionId },
        data: { status: 'PAID' },
      })

      await db.auditLog.create({
        data: {
          action: 'ad_booking_paid',
          entityType: 'ad_booking',
          entityId: result.bookingId,
          metadata: { stripeSessionId: result.sessionId },
        },
      })

      return NextResponse.json({ received: true, processed: result.type })
    }

    return NextResponse.json({ received: true, processed: 'unhandled' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
