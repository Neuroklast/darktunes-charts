import type { SupabaseClient } from '@supabase/supabase-js'

export interface ChartResultData {
  periodId: string
  trackId: string
  rank: number
  totalScore: number
  fanScore: number
  djScore: number
}

export interface ChartResultRecord extends ChartResultData {
  id: string
  createdAt: Date
}

export class ChartRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async upsertChartResult(data: ChartResultData): Promise<ChartResultRecord> {
    const { data: result, error } = await this.supabase
      .from('chart_results')
      .upsert({
        period_id: data.periodId,
        track_id: data.trackId,
        rank: data.rank,
        total_score: data.totalScore,
        fan_score: data.fanScore,
        dj_score: data.djScore
      }, { onConflict: 'period_id,track_id' })
      .select('*')
      .single()

    if (error) throw error

    return {
      id: result.id,
      periodId: result.period_id,
      trackId: result.track_id,
      rank: result.rank,
      totalScore: result.total_score,
      fanScore: result.fan_score,
      djScore: result.dj_score,
      createdAt: new Date(result.created_at)
    }
  }

  async findByPeriodId(periodId: string): Promise<ChartResultRecord[]> {
    const { data, error } = await this.supabase
      .from('chart_results')
      .select('*')
      .eq('period_id', periodId)
      .order('rank', { ascending: true })

    if (error || !data) return []

    return data.map((d: any) => ({
      id: d.id,
      periodId: d.period_id,
      trackId: d.track_id,
      rank: d.rank,
      totalScore: d.total_score,
      fanScore: d.fan_score,
      djScore: d.dj_score,
      createdAt: new Date(d.created_at)
    }))
  }

  async getLatestPublishedPeriodId(): Promise<string | null> {
    const { data } = await this.supabase
      .from('voting_periods')
      .select('id')
      .eq('is_active', false)
      .order('end_date', { ascending: false })
      .limit(1)
      .single()
    return data ? data.id : null
  }

  async getChartsByCategory(categoryId: string, periodId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('chart_results')
      .select('*, tracks(*, bands(*))')
      .eq('period_id', periodId)
    return data || []
  }

  async getChartsByPeriod(periodId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('chart_results')
      .select('*, tracks(*, bands(*))')
      .eq('period_id', periodId)
    return data || []
  }
}

let chartRepoInstance: ChartRepository | null = null

export function chartRepository(supabase: SupabaseClient): ChartRepository {
  if (!chartRepoInstance) {
    chartRepoInstance = new ChartRepository(supabase)
  }
  return chartRepoInstance
}
