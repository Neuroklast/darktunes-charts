/**
 * Stripe payment adapter (Spec §3.1).
 *
 * Handles Checkout session creation for additional chart category fees and
 * webhook processing for payment confirmation. Supports a 30-day trial period
 * for bands exploring additional categories. Financial transactions have
 * ZERO effect on chart ranking scores — payment only unlocks participation
 * in additional categories (Spec §3.2).
 */

import Stripe from 'stripe'
import type { Tier } from '@/lib/types'
import { calculateTierPrice } from '@/domain/payment/tierPricing'
import { TRIAL_PERIOD_DAYS } from '@/domain/payment/trialConfig'
import { buildTrialMetadata } from '@/domain/payment/trialStatus'

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
  /** When true, applies a 30-day trial period before billing begins. */
  enableTrial?: boolean
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
  const { bandId, tier, totalCategories, successUrl, cancelUrl, enableTrial = false } = params

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

  const trialStartDate = new Date().toISOString()
  const trialMetadata = enableTrial ? buildTrialMetadata(trialStartDate) : {}

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
    ...(enableTrial
      ? { subscription_data: { trial_period_days: TRIAL_PERIOD_DAYS } }
      : {}),
    metadata: {
      bandId,
      tier,
      paidCategories: String(pricing.paidCategories),
      ...trialMetadata,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return { sessionId: session.id, sessionUrl: session.url }
}

export type StripeWebhookResult =
  | { type: 'checkout.session.completed'; bandId: string; paidCategories: number; isTrial: boolean }
  | { type: 'customer.subscription.trial_will_end'; bandId: string; trialEndDate: string }
  | { type: 'customer.subscription.updated'; bandId: string; trialExpired: boolean }
  | { type: 'unhandled'; eventType: string }

/**
 * Verifies and processes a Stripe webhook payload.
 *
 * Handled events:
 * - `checkout.session.completed` → activates band's (trial or paid) categories.
 * - `customer.subscription.trial_will_end` → triggers trial expiration reminder.
 * - `customer.subscription.updated` → detects trial-to-paid conversion.
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
    const bandId = session.metadata?.bandId ?? ''
    const paidCategories = parseInt(session.metadata?.paidCategories ?? '0', 10)
    const isTrial = session.metadata?.is_trial === 'true'
    return { type: 'checkout.session.completed', bandId, paidCategories, isTrial }
  }

  if (event.type === 'customer.subscription.trial_will_end') {
    const subscription = event.data.object as Stripe.Subscription
    const bandId = subscription.metadata?.bandId ?? ''
    const trialEnd = subscription.trial_end
    const trialEndDate = trialEnd
      ? new Date(trialEnd * 1000).toISOString()
      : new Date().toISOString()
    return { type: 'customer.subscription.trial_will_end', bandId, trialEndDate }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const bandId = subscription.metadata?.bandId ?? ''
    const trialExpired =
      subscription.metadata?.is_trial === 'true' &&
      subscription.status === 'active' &&
      subscription.trial_end !== null &&
      subscription.trial_end < Math.floor(Date.now() / 1000)
    return { type: 'customer.subscription.updated', bandId, trialExpired }
  }

  return { type: 'unhandled', eventType: event.type }
}
