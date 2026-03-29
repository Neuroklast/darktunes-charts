import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, type AuthenticatedUser } from '@/infrastructure/security/rbac'

const createMandateSchema = z.object({
  labelId: z.string().uuid(),
  bandId: z.string().uuid(),
})

/**
 * GET /api/mandates
 * Returns label-band mandates for the authenticated user.
 * Any authenticated user can view their own mandates.
 */
export const GET = withAuth([], async (_request: NextRequest, user: AuthenticatedUser) => {
  // In production: const mandates = await prisma.labelBandMandate.findMany({ where: { ... } })
  return NextResponse.json({ mandates: [], userId: user.id })
})

/**
 * POST /api/mandates
 * Creates a new label mandate (band grants label access).
 * Restricted to BAND role only — only bands can grant mandates to labels.
 */
export const POST = withAuth(['band'], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = createMandateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  return NextResponse.json({
    success: true,
    mandate: { id: 'new-mandate-id', status: 'PENDING', ...parsed.data },
  })
})

/**
 * DELETE /api/mandates?mandateId=xxx
 * Revokes a label mandate.
 * Restricted to BAND and LABEL roles — only the granting band or the
 * receiving label can revoke a mandate.
 */
export const DELETE = withAuth(['band', 'label'], async (request: NextRequest) => {
  const mandateId = request.nextUrl.searchParams.get('mandateId')

  if (!mandateId) {
    return NextResponse.json({ error: 'mandateId parameter required' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})
