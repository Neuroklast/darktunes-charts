import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/infrastructure/audit'

const createCompilationSchema = z.object({
  title: z.string().min(1).max(200),
  period: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
  coverArtUrl: z.string().url().optional(),
})

type CompilationRow = {
  id: string
  title: string
  period: string
  status: string
  coverArtUrl: string | null
  description: string | null
  createdAt: Date
  publishedAt: Date | null
}

type CompilationDb = {
  compilation: {
    create: (args: unknown) => Promise<CompilationRow>
    findMany: (args: unknown) => Promise<CompilationRow[]>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * POST /api/admin/compilations
 * Creates a new compilation in DRAFT status. Admin only.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const body: unknown = await request.json()
      const parsed = createCompilationSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const compilation = await getDb().compilation.create({
        data: {
          title: parsed.data.title,
          period: parsed.data.period,
          description: parsed.data.description,
          coverArtUrl: parsed.data.coverArtUrl,
          status: 'DRAFT',
        },
      })

      await createAuditLog(
        'compilation_created',
        'Compilation',
        compilation.id,
        user.id,
        { title: compilation.title, period: compilation.period },
      )

      return NextResponse.json({ compilation }, { status: 201 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)

/**
 * GET /api/admin/compilations
 * Lists all compilations ordered by creation date desc. Admin only.
 */
export const GET = withAuth(
  ['ADMIN'],
  async (_request: NextRequest): Promise<NextResponse> => {
    try {
      const compilations = await getDb().compilation.findMany({
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ compilations })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
