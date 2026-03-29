import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/infrastructure/payment/stripeAdapter'
import { validateCoupon, type CouponRecord } from '@/domain/payment/couponValidation'
import type { Tier } from '@/lib/types'

const checkoutSchema = z.object({
  bandId: z.string().uuid(),
  tier: z.enum(['Micro', 'Emerging', 'Established', 'International', 'Macro']),
  totalCategories: z.number().int().min(2, 'Must have at least 2 categories for a paid checkout'),
  couponCode: z.string().max(50).transform((v) => v.trim().toUpperCase()).optional(),
})

/** Allowed origin domains for Stripe Checkout redirect URLs. */
const ALLOWED_ORIGINS_ENV = process.env.STRIPE_ALLOWED_ORIGINS ?? ''
const ALLOWED_ORIGINS = ALLOWED_ORIGINS_ENV
  ? ALLOWED_ORIGINS_ENV.split(',').map((o) => o.trim())
  : []

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for additional chart category fees.
 *
 * Only authenticated band users may call this endpoint.
 * Financial contribution has ZERO effect on chart rankings (Spec §3.2).
 */
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin')

    if (!origin) {
      return NextResponse.json({ error: 'Missing Origin header' }, { status: 400 })
    }

    // Validate origin against allowlist (in production set STRIPE_ALLOWED_ORIGINS env var)
    if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Validate and apply optional coupon code
    let couponDiscountPercent: number | undefined
    let couponId: string | undefined

    if (parsed.data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: parsed.data.couponCode },
      })

      const couponResult = validateCoupon(coupon as CouponRecord | null)

      if (!couponResult.valid) {
        return NextResponse.json(
          { error: 'Invalid coupon', reason: couponResult.reason },
          { status: 400 }
        )
      }

      couponDiscountPercent = couponResult.discountPercent
      couponId = couponResult.couponId

      // Increment usage counter
      await prisma.coupon.update({
        where: { id: couponResult.couponId },
        data: { currentUses: { increment: 1 } },
      })
    }

    const { sessionId, sessionUrl } = await createCheckoutSession({
      bandId: parsed.data.bandId,
      tier: parsed.data.tier as Tier,
      totalCategories: parsed.data.totalCategories,
      successUrl: `${origin}/dashboard/band?payment=success`,
      cancelUrl: `${origin}/dashboard/band?payment=cancelled`,
      couponDiscountPercent,
      couponId,
    })

    return NextResponse.json({ sessionId, sessionUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
