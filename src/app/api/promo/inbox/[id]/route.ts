/**
 * PATCH /api/promo/inbox/[id]
 * Update a DJ inbox item (mark as played/passed/read, add feedback).
 * Access: DJ who owns this inbox item, or ADMIN.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { DJFeedbackSchema } from '@/domain/promo'

export const PATCH = withAuth(['DJ', 'ADMIN'], async (request: NextRequest, user) => {
  const itemId = request.nextUrl.pathname.split('/').pop()

  if (!itemId) {
    return NextResponse.json({ error: 'Inbox item ID missing' }, { status: 400 })
  }

  const body: unknown = await request.json()
  const parsed = DJFeedbackSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const prismaTyped = prisma as unknown as {
    djInboxItem: {
      findUnique: (args: unknown) => Promise<{ id: string; djUserId: string } | null>
      update: (args: unknown) => Promise<{ id: string; status: string; feedbackMessage: string | null }>
    }
  }

  const item = await prismaTyped.djInboxItem.findUnique({ where: { id: itemId } })
  if (!item) {
    return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 })
  }

  if (user.role !== 'ADMIN' && item.djUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prismaTyped.djInboxItem.update({
    where: { id: itemId },
    data: {
      status: parsed.data.status,
      feedbackMessage: parsed.data.feedbackMessage ?? null,
    },
  })

  return NextResponse.json({ item: updated })
})
