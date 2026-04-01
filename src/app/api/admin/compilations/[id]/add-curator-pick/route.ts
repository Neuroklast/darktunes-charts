import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

const addCuratorPickSchema = z.object({
  releaseId: z.string().uuid(),
  trackTitle: z.string().min(1).max(500),
  bandName: z.string().min(1).max(500),
  curatorNote: z.string().max(1000).optional(),
})

type CompilationDb = {
  compilationCuratorEntry: {
    findFirst: (args: unknown) => Promise<{ userId: string; picks: number } | null>
    update: (args: unknown) => Promise<unknown>
  }
  compilationTrackEntry: {
    count: (args: unknown) => Promise<number>
    create: (args: unknown) => Promise<unknown>
  }
  compilation: {
    findUnique: (args: unknown) => Promise<{ id: string; status: string } | null>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * POST /api/admin/compilations/[id]/add-curator-pick
 *
 * Allows an assigned DJ curator to add their pick to the compilation.
 * The DJ must be an assigned curator for this compilation.
 * Available to DJ and ADMIN roles.
 *
 * Body: { releaseId, trackTitle, bandName, curatorNote? }
 */
export const POST = withAuth(
  ['DJ', 'ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const compilationId = pathSegments[pathSegments.length - 2]

      const body: unknown = await request.json()
      const parsed = addCuratorPickSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const compilation = await getDb().compilation.findUnique({
        where: { id: compilationId },
        select: { id: true, status: true },
      })

      if (!compilation) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
      }

      if (compilation.status !== 'CURATING') {
        return NextResponse.json(
          { error: 'Compilation is not in curating status' },
          { status: 409 },
        )
      }

      const curatorEntry = await getDb().compilationCuratorEntry.findFirst({
        where: { compilationId, userId: user.id },
      })

      if (!curatorEntry) {
        return NextResponse.json(
          { error: 'You are not an assigned curator for this compilation' },
          { status: 403 },
        )
      }

      const currentTrackCount = await getDb().compilationTrackEntry.count({
        where: { compilationId },
      })

      const position = currentTrackCount + 1

      await getDb().compilationTrackEntry.create({
        data: {
          compilationId,
          position,
          releaseId: parsed.data.releaseId,
          trackTitle: parsed.data.trackTitle,
          bandName: parsed.data.bandName,
          source: 'CURATOR_PICK',
          curatorId: user.id,
          curatorNote: parsed.data.curatorNote ?? null,
        },
      })

      await getDb().compilationCuratorEntry.update({
        where: { id: (curatorEntry as unknown as { id: string }).id },
        data: { picks: curatorEntry.picks + 1 },
      })

      return NextResponse.json({ success: true, position })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
