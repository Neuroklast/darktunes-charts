import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateAwardVotes } from '@/domain/awards'

const voteSchema = z.object({
  votes: z.array(
    z.object({
      nomineeId: z.string().uuid(),
      credits: z.number().int().min(1),
    }),
  ).min(1),
})

type AwardDb = {
  communityAward: {
    findUnique: (args: unknown) => Promise<{
      id: string
      votingOpen: boolean
      votingEndDate: Date
    } | null>
  }
  user: {
    findUnique: (args: unknown) => Promise<{ credits: number } | null>
  }
  awardVote: {
    createMany: (args: unknown) => Promise<unknown>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/awards/[id]/vote
 *
 * Submits quadratic votes for a community award. Authenticated fans only.
 * Credits are consumed from the user's balance.
 *
 * Body: { votes: [{ nomineeId, credits }] }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathSegments = new URL(request.url).pathname.split('/')
    const voteIndex = pathSegments.indexOf('vote')
    const awardId = pathSegments[voteIndex - 1]

    const award = await getDb().communityAward.findUnique({
      where: { id: awardId },
      select: { id: true, votingOpen: true, votingEndDate: true },
    })

    if (!award) {
      return NextResponse.json({ error: 'Award not found' }, { status: 404 })
    }

    if (!award.votingOpen) {
      return NextResponse.json({ error: 'Voting is not open for this award' }, { status: 409 })
    }

    if (new Date() > award.votingEndDate) {
      return NextResponse.json({ error: 'Voting period has ended' }, { status: 409 })
    }

    const dbUser = await getDb().user.findUnique({
      where: { id: authUser.id },
      select: { credits: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: unknown = await request.json()
    const parsed = voteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { valid, totalUsed, error: voteError } = validateAwardVotes(
      parsed.data.votes,
      dbUser.credits,
    )

    if (!valid) {
      return NextResponse.json({ error: voteError ?? 'Invalid votes' }, { status: 422 })
    }

    await getDb().awardVote.createMany({
      data: parsed.data.votes.map((v) => ({
        awardId,
        nomineeId: v.nomineeId,
        userId: authUser.id,
        credits: v.credits,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, creditsUsed: totalUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
