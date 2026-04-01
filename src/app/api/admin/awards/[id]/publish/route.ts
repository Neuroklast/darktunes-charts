import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/infrastructure/audit'

type AwardDb = {
  communityAward: {
    findUnique: (args: unknown) => Promise<{ id: string; winnerId: string | null } | null>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/admin/awards/[id]/publish
 * Publishes the award result (winner must already be computed). Admin only.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const awardId = pathSegments[pathSegments.length - 2]

      const award = await getDb().communityAward.findUnique({
        where: { id: awardId },
        select: { id: true, winnerId: true },
      })

      if (!award) {
        return NextResponse.json({ error: 'Award not found' }, { status: 404 })
      }

      if (!award.winnerId) {
        return NextResponse.json(
          { error: 'Winner must be computed before publishing' },
          { status: 409 },
        )
      }

      await createAuditLog(
        'award_published',
        'CommunityAward',
        awardId,
        user.id,
        { winnerId: award.winnerId },
      )

      return NextResponse.json({ success: true, winnerId: award.winnerId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
