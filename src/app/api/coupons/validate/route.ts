import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateCoupon, type CouponRecord } from '@/domain/payment/couponValidation'

const validateCouponSchema = z.object({
  code: z
    .string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code too long')
    .transform((v) => v.trim().toUpperCase()),
})

/**
 * POST /api/coupons/validate
 *
 * Validates a coupon code and returns discount details.
 * Requires authentication — only logged-in users may validate coupons.
 *
 * Request body: `{ code: string }`
 * Success response: `{ valid: true, discountPercent, partnerName, couponId }`
 * Failure response: `{ valid: false, reason: string }`
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = validateCouponSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: parsed.data.code },
    })

    const result = validateCoupon(coupon as CouponRecord | null)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
