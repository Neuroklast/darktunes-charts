import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { selectTopNominees, type AwardNominee } from '@/domain/awards'
import { createAuditLog } from '@/infrastructure/audit'

type NomineeRow = {
  id: string
  name: string
  description: string
  nominatedBy: string
  endorsementCount: number
  isFinalNominee: boolean
}

type AwardDb = {
  communityAward: {
    findUnique: (args: unknown) => Promise<{ id: string; votingOpen: boolean } | null>
    update: (args: unknown) => Promise<unknown>
  }
  awardNominee: {
    findMany: (args: unknown) => Promise<NomineeRow[]>
    updateMany: (args: unknown) => Promise<unknown>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/admin/awards/[id]/close-nominations
 *
 * Closes the nomination phase by selecting the top 5 nominees as finalists.
 * Admin only.
 *
 * Body: { count?: number } — number of finalists to select (default 5)
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const awardId = pathSegments[pathSegments.length - 2]

      const body: unknown = await request.json().catch(() => ({}))
      const bodyObj = body as Record<string, unknown>
      const count = typeof bodyObj.count === 'number' ? bodyObj.count : 5

      const award = await getDb().communityAward.findUnique({
        where: { id: awardId },
        select: { id: true, votingOpen: true },
      })

      if (!award) {
        return NextResponse.json({ error: 'Award not found' }, { status: 404 })
      }

      const rows = await getDb().awardNominee.findMany({
        where: { awardId },
        select: {
          id: true,
          name: true,
          description: true,
          nominatedBy: true,
          endorsementCount: true,
          isFinalNominee: true,
        },
      })

      const nominees: AwardNominee[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        nominatedBy: r.nominatedBy,
        endorsements: r.endorsementCount,
        isFinalNominee: r.isFinalNominee,
      }))

      const finalists = selectTopNominees(nominees, count)
      const finalistIds = finalists.map((f) => f.id)

      await getDb().awardNominee.updateMany({
        where: { awardId, id: { in: finalistIds } },
        data: { isFinalNominee: true },
      })

      await getDb().communityAward.update({
        where: { id: awardId },
        data: { votingOpen: true },
      })

      await createAuditLog(
        'award_nominations_closed',
        'CommunityAward',
        awardId,
        user.id,
        { finalistCount: finalistIds.length },
      )

      return NextResponse.json({ finalists: finalistIds.length })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
