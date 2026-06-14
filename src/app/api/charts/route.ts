import { NextResponse, type NextRequest } from 'next/server'
import { chartRepository } from '@/infrastructure/repositories/chartRepository'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
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
        { periodId: null, categories: {} },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
      )
    }

    const results = await chartRepository(supabase).getChartsByPeriod(periodId)

    return NextResponse.json(
      { periodId, total: results.length, data: results },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
