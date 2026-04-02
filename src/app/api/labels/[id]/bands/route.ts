/**
 * POST /api/labels/[id]/bands
 * Add a band to the label's roster.
 * Access: LABEL admin of this label, or ADMIN.
 *
 * The caller must be an ADMIN member of the label to add a band.
 * The band must not already belong to another label.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { AddBandToRosterSchema, isLabelAdmin } from '@/domain/labels'

export const POST = withAuth(['LABEL', 'ADMIN'], async (request: NextRequest, user) => {
  const labelId = request.nextUrl.pathname.split('/')[3]

  if (!labelId) {
    return NextResponse.json({ error: 'Label ID missing' }, { status: 400 })
  }

  const body: unknown = await request.json()
  const parsed = AddBandToRosterSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { bandId } = parsed.data

  const prismaTyped = prisma as unknown as {
    labelMember: { findMany: (args: unknown) => Promise<Array<{ id: string; labelId: string; userId: string; role: string; createdAt: Date }>> }
    band: {
      findUnique: (args: unknown) => Promise<{ id: string; labelId: string | null } | null>
      update: (args: unknown) => Promise<{ id: string; labelId: string | null }>
    }
  }

  // Verify caller is admin of this label (ADMIN role bypasses this check)
  if (user.role !== 'ADMIN') {
    const memberships = await prismaTyped.labelMember.findMany({
      where: { userId: user.id, labelId },
    })
    if (!isLabelAdmin(user.id, labelId, memberships.map((m) => ({ ...m, role: m.role as 'ADMIN' | 'MEMBER' })))) {
      return NextResponse.json({ error: 'Forbidden — label admin required' }, { status: 403 })
    }
  }

  // Verify band exists and has no other label
  const band = await prismaTyped.band.findUnique({ where: { id: bandId } })
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 })
  }
  if (band.labelId && band.labelId !== labelId) {
    return NextResponse.json({ error: 'Band already belongs to another label' }, { status: 409 })
  }

  const updated = await prismaTyped.band.update({
    where: { id: bandId },
    data: { labelId },
  })

  return NextResponse.json({ band: updated }, { status: 200 })
})
