import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type AwardDb = {
  awardNominee: {
    findUnique: (args: unknown) => Promise<{ id: string; endorsementCount: number } | null>
    update: (args: unknown) => Promise<unknown>
  }
  awardEndorsement: {
    findUnique: (args: unknown) => Promise<{ id: string } | null>
    create: (args: unknown) => Promise<unknown>
  }
}

function getDb() {
  return prisma as unknown as AwardDb
}

/**
 * POST /api/awards/[id]/endorse/[nomineeId]
 * Endorses a nomination. Each user can endorse a nominee once. Any authenticated user.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathSegments = new URL(request.url).pathname.split('/')
    const nomineeId = pathSegments[pathSegments.length - 1]

    const nominee = await getDb().awardNominee.findUnique({
      where: { id: nomineeId },
      select: { id: true, endorsementCount: true },
    })

    if (!nominee) {
      return NextResponse.json({ error: 'Nominee not found' }, { status: 404 })
    }

    const existing = await getDb().awardEndorsement.findUnique({
      where: {
        nomineeId_userId: { nomineeId, userId: authUser.id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already endorsed this nominee' }, { status: 409 })
    }

    await getDb().awardEndorsement.create({
      data: { nomineeId, userId: authUser.id },
    })

    await getDb().awardNominee.update({
      where: { id: nomineeId },
      data: { endorsementCount: nominee.endorsementCount + 1 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
