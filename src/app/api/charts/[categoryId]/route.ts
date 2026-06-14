import { NextResponse, type NextRequest } from 'next/server'
import { chartRepository } from '@/infrastructure/repositories/chartRepository'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'
import type { AllCategory } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/charts/[categoryId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
): Promise<NextResponse> {
  try {
    const { categoryId } = await params
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period')
    const supabase = await createClient()

    let periodId = periodParam ?? undefined
    if (!periodId) {
      const latestId = await chartRepository(supabase).getLatestPublishedPeriodId()
      periodId = latestId ?? undefined
    }

    if (!periodId) {
      return NextResponse.json(
        { categoryId, results: [], message: 'No published chart results available yet.' },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
      )
    }

    const results = await chartRepository(supabase).getChartsByCategory(categoryId, periodId)
    const categoryMeta = CATEGORY_DEFINITIONS[categoryId as AllCategory]

    const formattedResults = results.map((entry) => ({
      rank: entry.rank,
      release: entry.tracks
        ? {
            id: entry.tracks.id,
            title: entry.tracks.title,
            band: entry.tracks.bands?.name ?? null,
            bandSlug: entry.tracks.bands?.slug ?? null,
          }
        : { id: entry.track_id, title: entry.track_id, band: null, bandSlug: null },
      scores: {
        fanScore: entry.fan_score,
        djScore: entry.dj_score,
        combined: entry.total_score,
        appliedWeights: {
          fan: categoryMeta?.fanWeight || 0.5,
          dj: categoryMeta?.djWeight || 0.5,
        },
      },
      metadata: {
        computedAt: entry.created_at,
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
