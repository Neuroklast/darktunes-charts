/**
 * GET /api/v1/charts
 *
 * Returns all published chart results for the current (most recent published)
 * voting period. Requires a valid API key.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withApiKey(async (_request: NextRequest, _ctx: ApiKeyContext) => {
  const results = await prisma.chartResult.findMany({
    where: {
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
    orderBy: [{ categoryId: 'asc' }, { rank: 'asc' }],
  })

  return NextResponse.json({ charts: results })
})
