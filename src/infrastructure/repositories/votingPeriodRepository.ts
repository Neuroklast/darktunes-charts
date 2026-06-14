import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateVotingPeriodData {
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
}

export interface VotingPeriodRecord extends CreateVotingPeriodData {
  id: string
  createdAt: Date
}

export class VotingPeriodRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(data: CreateVotingPeriodData): Promise<VotingPeriodRecord> {
    const { data: result, error } = await this.supabase
      .from('voting_periods')
      .insert({
        name: data.name,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        is_active: data.isActive
      })
      .select('*')
      .single()

    if (error) throw error

    return {
      id: result.id,
      name: result.name,
      startDate: new Date(result.start_date),
      endDate: new Date(result.end_date),
      isActive: result.is_active,
      createdAt: new Date(result.created_at)
    }
  }

  async findActivePeriod(): Promise<VotingPeriodRecord | null> {
    const { data, error } = await this.supabase
      .from('voting_periods')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    }
  }

  async findActive(): Promise<VotingPeriodRecord | null> {
    return this.findActivePeriod()
  }
}

let periodRepoInstance: VotingPeriodRepository | null = null

export function votingPeriodRepository(supabase: SupabaseClient): VotingPeriodRepository {
  if (!periodRepoInstance) {
    periodRepoInstance = new VotingPeriodRepository(supabase)
  }
  return periodRepoInstance
}
