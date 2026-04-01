import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { computeAwardWinner, type AwardNominee } from '@/domain/awards'
import { createAuditLog } from '@/infrastructure/audit'

type NomineeRow = {
  id: string
  name: string
  description: string
  nominatedBy: string
  endorsementCount: number
  isFinalNominee: boolean
}

type VoteRow = {
  nomineeId: string
  credits: number
}

type AwardDb = {
  communityAward: {
    findUnique: (args: unknown) => Promise<{ id: string } | null>
    update: (args: unknown) => Promise<unknown>
  }
  awardNominee: {
    findMany: (args: unknown) => Promise<NomineeRow[]>
  }
  awardVote: {
    findMany: (args: unknown) => Promise<VoteRow[]>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/admin/awards/[id]/compute
 * Computes the award winner using quadratic voting. Admin only.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const awardId = pathSegments[pathSegments.length - 2]

      const award = await getDb().communityAward.findUnique({
        where: { id: awardId },
        select: { id: true },
      })

      if (!award) {
        return NextResponse.json({ error: 'Award not found' }, { status: 404 })
      }

      const [nomineeRows, voteRows] = await Promise.all([
        getDb().awardNominee.findMany({
          where: { awardId, isFinalNominee: true },
          select: {
            id: true,
            name: true,
            description: true,
            nominatedBy: true,
            endorsementCount: true,
            isFinalNominee: true,
          },
        }),
        getDb().awardVote.findMany({
          where: { awardId },
          select: { nomineeId: true, credits: true },
        }),
      ])

      const nominees: AwardNominee[] = nomineeRows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        nominatedBy: r.nominatedBy,
        endorsements: r.endorsementCount,
        isFinalNominee: r.isFinalNominee,
      }))

      const winner = computeAwardWinner(nominees, voteRows)

      if (!winner) {
        return NextResponse.json({ error: 'No winner could be determined' }, { status: 422 })
      }

      await getDb().communityAward.update({
        where: { id: awardId },
        data: { winnerId: winner.id, votingOpen: false },
      })

      await createAuditLog(
        'award_winner_computed',
        'CommunityAward',
        awardId,
        user.id,
        { winnerId: winner.id, winnerName: winner.name },
      )

      return NextResponse.json({ winner })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
