import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    findMany: (args: unknown) => Promise<CompilationRow[]>
  }
}

function getDb() {
  return prisma as unknown as CompilationDb
}

/**
 * GET /api/compilations
 * Returns all published compilations ordered by publishedAt desc. Public endpoint.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const compilations = await getDb().compilation.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    })

    return NextResponse.json({ compilations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
