/**
 * Stripe payment adapter (Spec §3.1).
 *
 * Handles Checkout session creation for additional chart category fees and
 * webhook processing for payment confirmation. Financial transactions have
 * ZERO effect on chart ranking scores — payment only unlocks participation
 * in additional categories (Spec §3.2).
 */

import Stripe from 'stripe'
import type { Tier } from '@/lib/types'
import { calculateTierPrice } from '@/domain/payment/tierPricing'

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })
}

export interface CheckoutSessionParams {
  bandId: string
  tier: Tier
  /** Total number of categories including the free first one. */
  totalCategories: number
  /** URL to redirect to after successful payment. */
  successUrl: string
  /** URL to redirect to if the user cancels checkout. */
  cancelUrl: string
}

export interface CheckoutSessionResult {
  sessionId: string
  sessionUrl: string
}

/**
 * Creates a Stripe Checkout session for a band's additional category fees.
 *
 * @param params - Session parameters including band ID, tier and category count.
 * @returns Stripe session ID and hosted checkout URL.
 * @throws Error if Stripe API call fails or STRIPE_SECRET_KEY is not set.
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const { bandId, tier, totalCategories, successUrl, cancelUrl } = params

  if (process.env.NEXT_PUBLIC_APP_ENV === 'test') {
    return {
      sessionId: `test_session_${Date.now()}`,
      sessionUrl: successUrl,
    }
  }

  const stripe = getStripeClient()

  const pricing = calculateTierPrice(tier, totalCategories)

  if (pricing.paidCategories === 0) {
    throw new Error('No paid categories: first category is always free, no checkout needed')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `DarkTunes Chart Kategorien (${tier})`,
            description: `${pricing.paidCategories} zusätzliche Kategorie(n) à ${pricing.pricePerCategoryEurCents / 100} €/Monat`,
          },
          recurring: { interval: 'month' },
          unit_amount: pricing.pricePerCategoryEurCents,
        },
        quantity: pricing.paidCategories,
      },
    ],
    metadata: { bandId, tier, paidCategories: String(pricing.paidCategories) },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return { sessionId: session.id, sessionUrl: session.url }
}

export type StripeWebhookResult =
  | { type: 'checkout.session.completed'; bandId: string; paidCategories: number }
  | { type: 'checkout.session.completed.ad_booking'; bookingId: string; sessionId: string }
  | { type: 'unhandled'; eventType: string }

/**
 * Verifies and processes a Stripe webhook payload.
 *
 * @param payload - Raw request body as a Buffer or string.
 * @param signature - Value of the `stripe-signature` header.
 * @returns Parsed event data for downstream processing.
 * @throws Error if signature verification fails or STRIPE_WEBHOOK_SECRET is not set.
 */
export async function handleWebhook(
  payload: Buffer | string,
  signature: string
): Promise<StripeWebhookResult> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
  }

  const stripe = getStripeClient()
  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Route by purpose metadata (ADR-018: ad bookings use separate routing)
    if (session.metadata?.purpose === 'ad_booking') {
      const bookingId = session.metadata.bookingId ?? ''
      return { type: 'checkout.session.completed.ad_booking', bookingId, sessionId: session.id }
    }

    const bandId = session.metadata?.bandId ?? ''
    const paidCategories = parseInt(session.metadata?.paidCategories ?? '0', 10)
    return { type: 'checkout.session.completed', bandId, paidCategories }
  }

  return { type: 'unhandled', eventType: event.type }
}
