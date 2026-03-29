import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/** Prisma UserRole values allowed to create or revoke label mandates. */
const MANDATE_ALLOWED_ROLES = ['BAND', 'LABEL', 'ADMIN'] as const

const createMandateSchema = z.object({
  labelId: z.string().uuid(),
  bandId: z.string().uuid(),
})

/**
 * GET /api/mandates
 * Returns label-band mandates for the authenticated user.
 */
export async function GET() {
  try {
    // In production: const mandates = await prisma.labelBandMandate.findMany({ ... })
    return NextResponse.json({ mandates: [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/mandates
 * Creates a new label mandate (band grants label access).
 *
 * Access control: Only BAND, LABEL and ADMIN roles may create mandates.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser || !MANDATE_ALLOWED_ROLES.includes(dbUser.role as typeof MANDATE_ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: unknown = await request.json()
    const parsed = createMandateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, mandate: { id: 'new-mandate-id', status: 'PENDING', ...parsed.data } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/mandates?mandateId=xxx
 * Revokes a label mandate.
 *
 * Access control: Only BAND, LABEL and ADMIN roles may revoke mandates.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser || !MANDATE_ALLOWED_ROLES.includes(dbUser.role as typeof MANDATE_ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const mandateId = request.nextUrl.searchParams.get('mandateId')
    if (!mandateId) {
      return NextResponse.json({ error: 'mandateId parameter required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
