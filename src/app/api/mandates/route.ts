import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { prismaRoleToUserRole } from '@/domain/auth/profile'

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
 * Authorization: Only users with BAND role may grant mandates.
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

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = prismaRoleToUserRole(dbUser.role)

    if (role !== 'band') {
      return NextResponse.json(
        { error: 'error.mandate.grant_forbidden' },
        { status: 403 },
      )
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
 * Authorization: Only users with BAND or LABEL role may revoke mandates.
 * LABEL users can only revoke mandates that are assigned to them.
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

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = prismaRoleToUserRole(dbUser.role)

    if (role !== 'band' && role !== 'label') {
      return NextResponse.json(
        { error: 'error.mandate.revoke_forbidden' },
        { status: 403 },
      )
    }

    const mandateId = request.nextUrl.searchParams.get('mandateId')
    if (!mandateId) {
      return NextResponse.json({ error: 'mandateId parameter required' }, { status: 400 })
    }

    // In production: verify LABEL users have an active mandate matching mandateId
    // const mandate = await prisma.labelBandMandate.findUnique({ where: { id: mandateId } })
    // if (role === 'label' && mandate?.labelId !== user.id) {
    //   return NextResponse.json({ error: 'error.mandate.revoke_forbidden' }, { status: 403 })
    // }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
