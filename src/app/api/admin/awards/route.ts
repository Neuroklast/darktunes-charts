import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/infrastructure/audit'

const createAwardSchema = z.object({
  category: z.enum([
    'CHRONICLER_OF_THE_NIGHT',
    'DARK_INTEGRITY',
    'NEWCOMER_OF_THE_YEAR',
    'COMPILATION_TRACK_OF_YEAR',
    'DJ_OF_THE_YEAR',
  ]),
  year: z.number().int().min(2020).max(2100),
  votingStartDate: z.string().datetime(),
  votingEndDate: z.string().datetime(),
})

type AwardDb = {
  communityAward: {
    create: (args: unknown) => Promise<{ id: string; category: string; year: number }>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/admin/awards
 * Creates a new community award. Admin only.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const body: unknown = await request.json()
      const parsed = createAwardSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const award = await getDb().communityAward.create({
        data: {
          category: parsed.data.category,
          year: parsed.data.year,
          votingStartDate: new Date(parsed.data.votingStartDate),
          votingEndDate: new Date(parsed.data.votingEndDate),
          votingOpen: false,
        },
      })

      await createAuditLog(
        'community_award_created',
        'CommunityAward',
        award.id,
        user.id,
        { category: award.category, year: award.year },
      )

      return NextResponse.json({ award }, { status: 201 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
