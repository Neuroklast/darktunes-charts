import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type PrismaClient = {
  user: {
    findUnique: (args: unknown) => Promise<{
      id: string
      email: string
      name: string
      displayName: string | null
      role: string
      credits: number
      region: string | null
      avatarUrl: string | null
      isDJVerified: boolean
      createdAt: Date
      updatedAt: Date
    } | null>
  }
  fanVote: {
    findMany: (args: unknown) => Promise<unknown[]>
  }
  dJBallot: {
    findMany: (args: unknown) => Promise<unknown[]>
  }
  auditLog: {
    findMany: (args: unknown) => Promise<unknown[]>
  }
}

const db = prisma as unknown as PrismaClient

/**
 * GET /api/auth/me/data-export
 *
 * GDPR Art. 20 — Right to data portability.
 * Returns all personal data stored about the authenticated user as a
 * structured JSON response suitable for download.
 *
 * Includes: profile, fan votes, DJ ballots, audit log entries.
 * Excludes: anonymised data that no longer references the user.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authUser.id

    const [profile, fanVotes, djBallots, auditLogs] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          role: true,
          credits: true,
          region: true,
          avatarUrl: true,
          isDJVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.fanVote.findMany({
        where: { userId },
        select: { id: true, trackId: true, votes: true, creditsCost: true, periodId: true, createdAt: true },
      }),
      db.dJBallot.findMany({
        where: { userId },
        select: { id: true, categoryId: true, rankings: true, periodId: true, createdAt: true },
      }),
      db.auditLog.findMany({
        where: { userId },
        select: { id: true, action: true, resource: true, createdAt: true },
      }),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      fanVotes,
      djBallots,
      auditLogs,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="darktunes-data-export-${userId}.json"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
