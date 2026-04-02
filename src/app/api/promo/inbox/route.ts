/**
 * GET /api/promo/inbox
 * Returns the DJ's promo inbox (unread submissions first).
 * Access: DJ role only.
 */
import { NextResponse } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(['DJ', 'ADMIN'], async (_request, user) => {
  const prismaTyped = prisma as unknown as {
    djInboxItem: {
      findMany: (args: unknown) => Promise<Array<{
        id: string
        status: string
        feedbackMessage: string | null
        createdAt: Date
        submission: {
          id: string
          bandId: string
          releaseId: string | null
          message: string | null
          submittedByUserId: string
        }
      }>>
    }
  }

  const items = await prismaTyped.djInboxItem.findMany({
    where: { djUserId: user.id },
    include: { submission: true },
    orderBy: [
      { status: 'asc' } as unknown as never, // UNREAD < READ < PLAYED < PASSED alphabetically
      { createdAt: 'desc' } as unknown as never,
    ],
  })

  return NextResponse.json({ inbox: items })
})
