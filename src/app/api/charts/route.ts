import { NextResponse, type NextRequest } from 'next/server'
import { chartRepository } from '@/infrastructure/repositories/chartRepository'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'
import type { AllCategory } from '@/lib/types'

/**
 * GET /api/charts
 *
 * Returns published chart results.
 * Query params:
 *   ?category=track        — filter by category slug
 *   ?period=<uuid>         — specific voting period (defaults to latest published)
 *
 * Response is cached for 60 seconds (chart results change only when published).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('category')
    const periodParam = searchParams.get('period')

    let periodId = periodParam
    if (!periodId) {
      periodId = await chartRepository.getLatestPublishedPeriodId()
    }

    if (!periodId) {
      return NextResponse.json(
        { results: [], message: 'No published chart results available yet.' },
        {
          headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
        },
      )
    }

    const results = categoryParam
      ? await chartRepository.getChartsByCategory(categoryParam, periodId)
      : await chartRepository.getChartsByPeriod(periodId)

    // Format results into the transparency response format
    const formattedResults = results.map((entry) => {
      const categoryMeta = CATEGORY_DEFINITIONS[entry.categoryId as AllCategory]

      return {
        rank: entry.rank,
        categoryId: entry.categoryId,
        categoryName: categoryMeta?.name ?? entry.categoryId,
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
      }
    })

    return NextResponse.json(
      { results: formattedResults, periodId, total: formattedResults.length },
      {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
