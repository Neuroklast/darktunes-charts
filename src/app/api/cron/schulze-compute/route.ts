import { NextResponse, type NextRequest } from 'next/server'
import { calculateSchulzeMethod } from '@/domain/voting/schulze'
import { calculateCombinedScores } from '@/domain/voting/combined'

/**
 * Vercel Cron Job: /api/cron/schulze-compute
 * Runs every hour.
 * Recomputes Schulze rankings from all active DJ ballots and updates ChartSnapshot.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const computedAt = new Date().toISOString()

    // In production:
    // 1. Load all active DJBallots from database
    // const ballots = await prisma.dJBallot.findMany({ where: { period: { isActive: true } }, include: { entries: true } })
    // 2. Group by genre
    // 3. Run calculateSchulzeMethod for each genre
    // 4. Load fan scores and peer scores
    // 5. Run calculateCombinedScores
    // 6. Upsert ChartSnapshot records

    const mockCandidates: string[] = []
    const mockBallots: Array<{ djId: string; rankings: string[] }> = []

    const schulzeResult = calculateSchulzeMethod(mockCandidates, mockBallots)
    const combinedScores = calculateCombinedScores([])

    return NextResponse.json({
      success: true,
      computedAt,
      schulzeRankings: schulzeResult.rankings.length,
      combinedScores: combinedScores.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
