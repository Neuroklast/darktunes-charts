/**
 * GET /api/v1/stats
 *
 * Returns platform-wide statistics. Requires a valid API key.
 *
 * Stats returned:
 *  - `totalBands`       — total registered bands
 *  - `totalVoters`      — users with role FAN (primary voting cohort)
 *  - `activePeriod`     — current open voting period, or null if none
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withApiKey } from '@/lib/apiKeyAuth'
import type { ApiKeyContext } from '@/lib/apiKeyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withApiKey(async (_request: NextRequest, _ctx: ApiKeyContext) => {
  const [totalBands, totalVoters, activePeriod] = await Promise.all([
    prisma.band.count(),
    prisma.user.count({ where: { role: 'FAN' as never } }),
    prisma.votingPeriod.findFirst({
      where: { status: 'OPEN' as never },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: { startDate: 'desc' },
    }),
  ])

  return NextResponse.json({
    totalBands,
    totalVoters,
    activePeriod,
  })
})
