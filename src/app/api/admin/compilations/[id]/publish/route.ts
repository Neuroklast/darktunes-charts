import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/infrastructure/audit'

type CompilationDb = {
  compilation: {
    findUnique: (args: unknown) => Promise<{ id: string; status: string } | null>
    update: (args: unknown) => Promise<unknown>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * POST /api/admin/compilations/[id]/publish
 *
 * Publishes a finalized compilation, making it visible to the public. Admin only.
 * Requires status to be FINALIZED.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const pathSegments = new URL(request.url).pathname.split('/')
      const compilationId = pathSegments[pathSegments.length - 2]

      const compilation = await getDb().compilation.findUnique({
        where: { id: compilationId },
        select: { id: true, status: true },
      })

      if (!compilation) {
        return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
      }

      if (compilation.status !== 'FINALIZED') {
        return NextResponse.json(
          { error: 'Only finalized compilations can be published' },
          { status: 409 },
        )
      }

      await getDb().compilation.update({
        where: { id: compilationId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      })

      await createAuditLog(
        'compilation_published',
        'Compilation',
        compilationId,
        user.id,
        {},
      )

      return NextResponse.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
