/**
 * DELETE /api/labels/[id]/bands/[bandId]
 * Remove a band from the label's roster.
 * Access: LABEL admin of this label, or ADMIN.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { isLabelAdmin } from '@/domain/labels'

export const DELETE = withAuth(['LABEL', 'ADMIN'], async (request: NextRequest, user) => {
  const segments = request.nextUrl.pathname.split('/')
  // /api/labels/[id]/bands/[bandId]
  const labelId = segments[3]
  const bandId = segments[5]

  if (!labelId || !bandId) {
    return NextResponse.json({ error: 'Label ID or Band ID missing' }, { status: 400 })
  }

  const prismaTyped = prisma as unknown as {
    labelMember: { findMany: (args: unknown) => Promise<Array<{ id: string; labelId: string; userId: string; role: string; createdAt: Date }>> }
    band: {
      findUnique: (args: unknown) => Promise<{ id: string; labelId: string | null } | null>
      update: (args: unknown) => Promise<{ id: string; labelId: string | null }>
    }
  }

  if (user.role !== 'ADMIN') {
    const memberships = await prismaTyped.labelMember.findMany({
      where: { userId: user.id, labelId },
    })
    if (!isLabelAdmin(user.id, labelId, memberships.map((m) => ({ ...m, role: m.role as 'ADMIN' | 'MEMBER' })))) {
      return NextResponse.json({ error: 'Forbidden — label admin required' }, { status: 403 })
    }
  }

  const band = await prismaTyped.band.findUnique({ where: { id: bandId } })
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 })
  }
  if (band.labelId !== labelId) {
    return NextResponse.json({ error: 'Band is not in this label' }, { status: 404 })
  }

  await prismaTyped.band.update({
    where: { id: bandId },
    data: { labelId: null },
  })

  return NextResponse.json({ success: true })
})
