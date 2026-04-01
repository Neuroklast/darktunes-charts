/**
 * GET /api/v1/charts/[category]
 *
 * Returns published chart results for a specific category.
 * Requires a valid API key.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ category: string }>
}

export function GET(request: NextRequest, context: RouteContext) {
  return withApiKey(async (_req: NextRequest, _ctx: ApiKeyContext) => {
    const { category } = await context.params

    const results = await prisma.chartResult.findMany({
      where: {
        categoryId: category,
        votingPeriod: { status: 'PUBLISHED' as never },
      },
      select: {
        id: true,
        categoryId: true,
        releaseId: true,
        rank: true,
        fanScore: true,
        djScore: true,
        combinedScore: true,
        totalFanVotes: true,
        totalDJBallots: true,
        votingPeriod: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
        release: {
          select: {
            id: true,
            title: true,
            type: true,
            band: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { rank: 'asc' },
    })

    if (results.length === 0) {
      return NextResponse.json(
        { error: `No published chart results found for category: ${category}` },
        { status: 404 },
      )
    }

    return NextResponse.json({ category, charts: results })
  })(request)
}
