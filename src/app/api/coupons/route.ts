import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be at most 50 characters')
    .transform((v) => v.trim().toUpperCase()),
  discountPercent: z.number().int().min(1).max(100),
  maxUses: z.number().int().min(1),
  validUntil: z.string().datetime({ message: 'Must be a valid ISO 8601 date string' }),
  partnerId: z.string().min(1, 'Partner ID is required'),
  partnerName: z.string().min(1, 'Partner name is required').max(200),
})

/** Prisma roles that may manage coupons. */
const ADMIN_ROLES = ['ADMIN', 'EDITOR'] as const

/**
 * GET /api/coupons
 *
 * Lists all coupons (admin/editor only).
 * Returns active coupons first, then inactive, ordered by creation date descending.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser || !ADMIN_ROLES.includes(dbUser.role as (typeof ADMIN_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/coupons
 *
 * Creates a new coupon (admin/editor only).
 *
 * Request body:
 * ```json
 * {
 *   "code": "FESTIVAL2026",
 *   "discountPercent": 20,
 *   "maxUses": 100,
 *   "validUntil": "2026-12-31T23:59:59Z",
 *   "partnerId": "partner-uuid",
 *   "partnerName": "WGT Festival"
 * }
 * ```
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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser || !ADMIN_ROLES.includes(dbUser.role as (typeof ADMIN_ROLES)[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: unknown = await request.json()
    const parsed = createCouponSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.data.code,
        discountPercent: parsed.data.discountPercent,
        maxUses: parsed.data.maxUses,
        validUntil: new Date(parsed.data.validUntil),
        partnerId: parsed.data.partnerId,
        partnerName: parsed.data.partnerName,
      },
    })

    return NextResponse.json({ success: true, coupon }, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 409 }
      )
    }

    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
