/**
 * @module infrastructure/repositories
 *
 * Concrete repository implementations.
 *
 * - Prisma implementations for production use.
 * - In-memory implementations for unit/integration testing.
 */
export { PrismaUserRepository } from './PrismaUserRepository'
export { PrismaBandRepository } from './PrismaBandRepository'
export { PrismaAchievementRepository } from './PrismaAchievementRepository'

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
