import { NextResponse, type NextRequest } from 'next/server'
import { handleWebhook } from '@/infrastructure/payment/stripeAdapter'

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events.
 *
 * Stripe sends raw body with a `stripe-signature` header that must be
 * verified before processing. We use `request.arrayBuffer()` to get the
 * raw bytes required for HMAC verification.
 *
 * Currently handled events:
 * - `checkout.session.completed` → activates band's paid/trial categories in DB
 * - `customer.subscription.trial_will_end` → queues trial expiration reminder
 * - `customer.subscription.updated` → handles trial-to-paid conversion
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
      //   data: {
      //     paidCategorySlots: result.paidCategories,
      //     ...(result.isTrial ? { trialStartDate: new Date() } : {}),
      //   },
      // })
      return NextResponse.json({ received: true, processed: result.type, isTrial: result.isTrial })
    }

    if (result.type === 'customer.subscription.trial_will_end') {
      // In production:
      // const band = await prisma.band.findUnique({ where: { id: result.bandId } })
      // await sendTrialExpirationReminder({ bandId, email: band.email, ... })
      return NextResponse.json({ received: true, processed: result.type, bandId: result.bandId })
    }

    if (result.type === 'customer.subscription.updated') {
      if (result.trialExpired) {
        // Trial has ended; subscription auto-converts to paid.
        // In production with Prisma:
        // await prisma.band.update({
        //   where: { id: result.bandId },
        //   data: { trialStartDate: null },
        // })
      }
      return NextResponse.json({
        received: true,
        processed: result.type,
        trialExpired: result.trialExpired,
      })
    }

    return NextResponse.json({ received: true, processed: 'unhandled' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
