import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateNomination } from '@/domain/awards'

const nominationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
})

type AwardDb = {
  communityAward: {
    findUnique: (args: unknown) => Promise<{ id: string; votingOpen: boolean } | null>
  }
  awardNominee: {
    create: (args: unknown) => Promise<{ id: string }>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/awards/[id]/nominate
 * Submits a nomination for a community award. Any authenticated user.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathSegments = new URL(request.url).pathname.split('/')
    const nominateIndex = pathSegments.indexOf('nominate')
    const awardId = pathSegments[nominateIndex - 1]

    const award = await getDb().communityAward.findUnique({
      where: { id: awardId },
      select: { id: true, votingOpen: true },
    })

    if (!award) {
      return NextResponse.json({ error: 'Award not found' }, { status: 404 })
    }

    if (award.votingOpen) {
      return NextResponse.json(
        { error: 'Nominations are closed — voting is already open' },
        { status: 409 },
      )
    }

    const body: unknown = await request.json()
    const parsed = nominationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { valid, errors } = validateNomination({
      name: parsed.data.name,
      description: parsed.data.description,
      nominatedBy: authUser.id,
    })

    if (!valid) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })
    }

    const nominee = await getDb().awardNominee.create({
      data: {
        awardId,
        name: parsed.data.name,
        description: parsed.data.description,
        nominatedBy: authUser.id,
        endorsementCount: 0,
        isFinalNominee: false,
      },
    })

    return NextResponse.json({ nominee }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
