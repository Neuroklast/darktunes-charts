import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type NomineeRow = {
  id: string
  name: string
  description: string
  nominatedBy: string
  endorsementCount: number
  isFinalNominee: boolean
}

type AwardRow = {
  id: string
  category: string
  year: number
  votingOpen: boolean
  votingStartDate: Date
  votingEndDate: Date
  winnerId: string | null
  nominees: NomineeRow[]
}

type AwardDb = {
  communityAward: {
    findUnique: (args: unknown) => Promise<AwardRow | null>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * GET /api/awards/[id]
 * Returns a community award with its nominees. Public endpoint.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const pathSegments = new URL(request.url).pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]

    const award = await getDb().communityAward.findUnique({
      where: { id },
      include: {
        nominees: {
          orderBy: { endorsementCount: 'desc' },
        },
      },
    })

    if (!award) {
      return NextResponse.json({ error: 'Award not found' }, { status: 404 })
    }

    return NextResponse.json({ award })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
