/**
 * POST /api/promo/submit
 * Submit a release to the DJ Promo Pool.
 * Access: BAND (own releases only), LABEL (roster bands), ADMIN.
 *
 * This endpoint enforces the canSubmitPromo domain rule to ensure bands can
 * only submit for themselves, and labels only for their roster bands.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { SubmitPromoSchema, canSubmitPromo } from '@/domain/promo'
import type { PrismaUserRole } from '@/domain/auth/profile'

export const POST = withAuth(['BAND', 'LABEL', 'ADMIN'], async (request: NextRequest, user) => {
  const body: unknown = await request.json()
  const parsed = SubmitPromoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { bandId, releaseId, message } = parsed.data

  const prismaTyped = prisma as unknown as {
    band: {
      findUnique: (args: unknown) => Promise<{ id: string; ownerId: string; labelId: string | null } | null>
    }
    labelMember: {
      findMany: (args: unknown) => Promise<Array<{ labelId: string }>>
    }
    promoSubmission: {
      create: (args: unknown) => Promise<{ id: string; status: string }>
    }
  }

  const band = await prismaTyped.band.findUnique({ where: { id: bandId } })
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 })
  }

  // Resolve which labels the user belongs to (for LABEL role check)
  let userLabelIds: string[] = []
  if (user.role === 'LABEL') {
    const memberships = await prismaTyped.labelMember.findMany({
      where: { userId: user.id },
    })
    userLabelIds = memberships.map((m) => m.labelId)
  }

  if (!canSubmitPromo(user.role as PrismaUserRole, user.id, band.ownerId, band.labelId, userLabelIds)) {
    return NextResponse.json({ error: 'Forbidden — you may not submit promo for this band' }, { status: 403 })
  }

  const submission = await prismaTyped.promoSubmission.create({
    data: {
      submittedByUserId: user.id,
      bandId,
      releaseId: releaseId ?? null,
      message: message ?? null,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ submission }, { status: 201 })
})
