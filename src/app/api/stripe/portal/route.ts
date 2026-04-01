import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stripe/portal
 *
 * Returns a Stripe Customer Portal URL for subscription management.
 * Requires authenticated band user with an existing Stripe customer ID.
 *
 * Returns: { url }
 */
export const GET = withAuth(
  ['BAND', 'ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY
      if (!secretKey) {
        return NextResponse.json(
          { error: 'Stripe is not configured' },
          { status: 503 },
        )
      }

      const origin = request.headers.get('origin') ?? request.headers.get('referer')
      const returnUrl = origin
        ? `${new URL(origin).origin}/dashboard/band`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') ?? ''}/dashboard/band`

      // Fetch the band's Stripe customer ID
      const band = await (prisma as unknown as {
        band: {
          findUnique: (args: unknown) => Promise<{
            stripeCustomerId: string | null
          } | null>
        }
      }).band.findUnique({
        where: { ownerId: user.id },
        select: { stripeCustomerId: true },
      })

      if (!band?.stripeCustomerId) {
        return NextResponse.json(
          { error: 'No Stripe subscription found for this account' },
          { status: 404 },
        )
      }

      const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })

      const session = await stripe.billingPortal.sessions.create({
        customer: band.stripeCustomerId,
        return_url: returnUrl,
      })

      return NextResponse.json({ url: session.url })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
