/**
 * @module infrastructure/repositories
 *
 * Concrete repository implementations backed by Supabase.
 * In-memory implementations for unit/integration testing.
 */
export { SupabaseUserRepository } from './SupabaseUserRepository'
export { SupabaseBandRepository } from './SupabaseBandRepository'
export { SupabaseAchievementRepository } from './SupabaseAchievementRepository'

export { InMemoryUserRepository } from './InMemoryUserRepository'
export { InMemoryBandRepository } from './InMemoryBandRepository'
export { InMemoryAchievementRepository } from './InMemoryAchievementRepository'

export { ReleaseRepository, releaseRepository } from './releaseRepository'
export type { CreateReleaseData, ReleaseRecord } from './releaseRepository'

export { VoteRepository, voteRepository } from './voteRepository'
export type { CreateFanVoteData, FanVoteRecord, CreateDJBallotData, DJBallotRecord } from './voteRepository'

export { ChartRepository, chartRepository } from './chartRepository'
export type { ChartResultData, ChartResultRecord } from './chartRepository'

export { VotingPeriodRepository, votingPeriodRepository } from './votingPeriodRepository'
export type { VotingPeriodRecord, CreateVotingPeriodData } from './votingPeriodRepository'

export { LabelRepository } from './labelRepository'
