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
 * - `checkout.session.completed` → activates band's paid categories in DB
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

    return NextResponse.json({ received: true, processed: 'unhandled' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
