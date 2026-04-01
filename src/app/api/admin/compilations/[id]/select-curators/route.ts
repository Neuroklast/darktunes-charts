import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { selectCurators, type DJProfile } from '@/domain/compilation'
import { createAuditLog } from '@/infrastructure/audit'

type DJVerificationRow = {
  userId: string
  djName: string
  submittedAt: Date
  user: {
    djBallots: { id: string }[]
  }
}

type CuratorEntryRow = {
  lastCuratedPeriod: string | null
}

type CompilationDb = {
  djVerification: {
    findMany: (args: unknown) => Promise<DJVerificationRow[]>
  }
  compilationCuratorEntry: {
    findMany: (args: unknown) => Promise<CuratorEntryRow[]>
    deleteMany: (args: unknown) => Promise<unknown>
    createMany: (args: unknown) => Promise<unknown>
  }
  compilation: {
    findUnique: (args: unknown) => Promise<{ id: string } | null>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * POST /api/admin/compilations/[id]/select-curators
 *
 * Runs the curator lottery to assign 3 DJs to the compilation.
 * Excludes DJs who curated the previous compilation. Admin only.
 *
 * Body: { previousCurators?: string[] }
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const compilationId = pathSegments[pathSegments.length - 2]

      const body: unknown = await request.json()
      const bodyObj = body as Record<string, unknown>
      const previousCurators = Array.isArray(bodyObj.previousCurators)
        ? (bodyObj.previousCurators as string[])
        : []

      const compilation = await getDb().compilation.findUnique({
        where: { id: compilationId },
        select: { id: true },
      })

      if (!compilation) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
      }

      const verifiedDJs = await getDb().djVerification.findMany({
        where: { status: 'APPROVED' },
        include: {
          user: {
            include: {
              djBallots: { select: { id: true } },
            },
          },
        },
      })

      const pool: DJProfile[] = verifiedDJs.map((dj) => {
        const monthsActive = Math.floor(
          (Date.now() - new Date(dj.submittedAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
        )
        return {
          userId: dj.userId,
          djName: dj.djName,
          monthsActive,
          ballotsSubmitted: dj.user.djBallots.length,
        }
      })

      const selected = selectCurators(pool, previousCurators)

      await getDb().compilationCuratorEntry.deleteMany({ where: { compilationId } })

      await getDb().compilationCuratorEntry.createMany({
        data: selected.map((c) => ({
          compilationId,
          userId: c.userId,
          djName: c.djName,
          picks: 0,
          lastCuratedPeriod: c.lastCuratedPeriod ?? null,
        })),
      })

      await createAuditLog(
        'compilation_curators_selected',
        'Compilation',
        compilationId,
        user.id,
        { curatorIds: selected.map((c) => c.userId) },
      )

      return NextResponse.json({ curators: selected })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
