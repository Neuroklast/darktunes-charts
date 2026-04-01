import { NextResponse, type NextRequest } from 'next/server'
import { chartRepository } from '@/infrastructure/repositories/chartRepository'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'
import type { AllCategory } from '@/lib/types'

/**
 * GET /api/charts/[categoryId]
 *
 * Returns chart results for a specific category with full transparency data.
 * Query params:
 *   ?period=<uuid>  — specific voting period (defaults to latest published)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
): Promise<NextResponse> {
  try {
    const { categoryId } = await params
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period')

    let periodId = periodParam ?? undefined
    if (!periodId) {
      const latestId = await chartRepository.getLatestPublishedPeriodId()
      periodId = latestId ?? undefined
    }

    if (!periodId) {
      return NextResponse.json(
        {
          categoryId,
          results: [],
          message: 'No published chart results available yet.',
        },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
      )
    }

    const results = await chartRepository.getChartsByCategory(categoryId, periodId)
    const categoryMeta = CATEGORY_DEFINITIONS[categoryId as AllCategory]

    const formattedResults = results.map((entry) => ({
      rank: entry.rank,
      release: entry.release
        ? {
            id: entry.release.id,
            title: entry.release.title,
            band: entry.release.band?.name ?? null,
            bandSlug: entry.release.band?.slug ?? null,
          }
        : { id: entry.releaseId, title: entry.releaseId, band: null, bandSlug: null },
      scores: {
        fanScore: entry.fanScore,
        djScore: entry.djScore,
        combined: entry.combinedScore,
        appliedWeights: {
          fan: entry.appliedFanWeight,
          dj: entry.appliedDjWeight,
        },
      },
      metadata: {
        totalFanVotes: entry.totalFanVotes,
        totalDJBallots: entry.totalDJBallots,
        quorumMet: entry.quorumMet,
        computedAt: entry.createdAt.toISOString(),
      },
    }))

    return NextResponse.json(
      {
        categoryId,
        categoryName: categoryMeta?.name ?? categoryId,
        periodId,
        results: formattedResults,
        total: formattedResults.length,
        weights: categoryMeta
          ? { fan: categoryMeta.fanWeight, dj: categoryMeta.djWeight }
          : null,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
