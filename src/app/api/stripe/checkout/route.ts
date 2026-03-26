import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/infrastructure/payment/stripeAdapter'
import type { Tier } from '@/lib/types'

const checkoutSchema = z.object({
  bandId: z.string().uuid(),
  tier: z.enum(['Micro', 'Emerging', 'Established', 'International', 'Macro']),
  totalCategories: z.number().int().min(2, 'Must have at least 2 categories for a paid checkout'),
})

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for additional chart category fees.
 *
 * Only authenticated band users may call this endpoint.
 * Financial contribution has ZERO effect on chart rankings (Spec §3.2).
 */
export async function POST(request: NextRequest) {
  try {
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

    const origin = request.headers.get('origin') ?? 'https://darktunes.com'
    const { sessionId, sessionUrl } = await createCheckoutSession({
      bandId: parsed.data.bandId,
      tier: parsed.data.tier as Tier,
      totalCategories: parsed.data.totalCategories,
      successUrl: `${origin}/dashboard/band?payment=success`,
      cancelUrl: `${origin}/dashboard/band?payment=cancelled`,
    })

    return NextResponse.json({ sessionId, sessionUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
