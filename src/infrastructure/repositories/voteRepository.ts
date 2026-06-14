import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateFanVoteData {
  voterId: string
  trackId: string
  periodId: string
  creditsSpent: number
}

export interface FanVoteRecord extends CreateFanVoteData {
  id: string
  createdAt: Date
}

export interface CreateDJBallotData {
  voterId: string
  periodId: string
  rankedTrackIds: string[]
}

export interface DJBallotRecord extends CreateDJBallotData {
  id: string
  createdAt: Date
}

export class VoteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createFanVote(data: CreateFanVoteData): Promise<FanVoteRecord> {
    const { data: result, error } = await this.supabase
      .from('fan_votes')
      .insert({
        voter_id: data.voterId,
        track_id: data.trackId,
        period_id: data.periodId,
        credits_spent: data.creditsSpent
      })
      .select('*')
      .single()

    if (error) throw error

    return {
      id: result.id,
      voterId: result.voter_id,
      trackId: result.track_id,
      periodId: result.period_id,
      creditsSpent: result.credits_spent,
      createdAt: new Date(result.created_at)
    }
  }

  async createDJBallot(data: CreateDJBallotData): Promise<DJBallotRecord> {
    const { data: result, error } = await this.supabase
      .from('dj_ballots')
      .insert({
        voter_id: data.voterId,
        period_id: data.periodId,
        ranked_track_ids: data.rankedTrackIds
      })
      .select('*')
      .single()

    if (error) throw error

    return {
      id: result.id,
      voterId: result.voter_id,
      periodId: result.period_id,
      rankedTrackIds: result.ranked_track_ids,
      createdAt: new Date(result.created_at)
    }
  }

  async findFanVotesByPeriod(periodId: string): Promise<FanVoteRecord[]> {
    const { data, error } = await this.supabase
      .from('fan_votes')
      .select('*')
      .eq('period_id', periodId)

    if (error || !data) return []

    return data.map(d => ({
      id: d.id,
      voterId: d.voter_id,
      trackId: d.track_id,
      periodId: d.period_id,
      creditsSpent: d.credits_spent,
      createdAt: new Date(d.created_at)
    }))
  }

  async findDJBallotsByPeriod(periodId: string): Promise<DJBallotRecord[]> {
    const { data, error } = await this.supabase
      .from('dj_ballots')
      .select('*')
      .eq('period_id', periodId)

    if (error || !data) return []

    return data.map(d => ({
      id: d.id,
      voterId: d.voter_id,
      periodId: d.period_id,
      rankedTrackIds: d.ranked_track_ids,
      createdAt: new Date(d.created_at)
    }))
  }

  async getRemainingCredits(voterId: string, periodId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('fan_votes')
      .select('credits_spent')
      .eq('voter_id', voterId)
      .eq('period_id', periodId)

    if (error || !data) return 100

    const spent = data.reduce((acc: number, curr: any) => acc + curr.credits_spent, 0)
    return Math.max(0, 100 - spent)
  }

  async getUserVotesForPeriod(voterId: string, periodId: string): Promise<FanVoteRecord[]> {
    const { data, error } = await this.supabase
      .from('fan_votes')
      .select('*')
      .eq('voter_id', voterId)
      .eq('period_id', periodId)

    if (error || !data) return []

    return data.map((d: any) => ({
      id: d.id,
      voterId: d.voter_id,
      trackId: d.track_id,
      periodId: d.period_id,
      creditsSpent: d.credits_spent,
      createdAt: new Date(d.created_at)
    }))
  }

  async getUserBallotsForPeriod(voterId: string, periodId: string): Promise<DJBallotRecord[]> {
    const { data, error } = await this.supabase
      .from('dj_ballots')
      .select('*')
      .eq('voter_id', voterId)
      .eq('period_id', periodId)

    if (error || !data) return []

    return data.map((d: any) => ({
      id: d.id,
      voterId: d.voter_id,
      periodId: d.period_id,
      rankedTrackIds: d.ranked_track_ids,
      createdAt: new Date(d.created_at)
    }))
  }
}

let voteRepoInstance: VoteRepository | null = null

export function voteRepository(supabase: SupabaseClient): VoteRepository {
  if (!voteRepoInstance) {
    voteRepoInstance = new VoteRepository(supabase)
  }
  return voteRepoInstance
}
