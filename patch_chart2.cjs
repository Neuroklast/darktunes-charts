const fs = require('fs');
let code = fs.readFileSync('src/infrastructure/repositories/chartRepository.ts', 'utf8');

code = code.replace(/Object\.assign\(ChartRepository\.prototype, \{[\s\S]*\}\)/, '');

code = code.replace(/async findByPeriodId\(periodId: string\): Promise<ChartResultRecord\[\]> \{[\s\S]*?\}\n  \}/, `async findByPeriodId(periodId: string): Promise<ChartResultRecord[]> {
    const { data, error } = await this.supabase
      .from('chart_results')
      .select('*')
      .eq('period_id', periodId)
      .order('rank', { ascending: true })

    if (error || !data) return []

    return data.map(d => ({
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
}`);

fs.writeFileSync('src/infrastructure/repositories/chartRepository.ts', code);
