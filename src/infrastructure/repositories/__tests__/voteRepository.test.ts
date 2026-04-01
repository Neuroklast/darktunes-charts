import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VoteRepository } from '../voteRepository'
import { MONTHLY_CREDIT_BUDGET } from '@/domain/voting/quadratic'

// Mock @/lib/prisma to prevent Prisma client initialization (no DATABASE_URL in tests)
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}))

// ── Mock Prisma ──────────────────────────────────────────────────────────────

// We pass a mock prisma instance directly to the VoteRepository constructor,
// bypassing the real Prisma client singleton (which requires DATABASE_URL).

const mockFanVoteCreate = vi.fn()
const mockFanVoteFindMany = vi.fn()
const mockFanVoteAggregate = vi.fn()
const mockDJBallotCreate = vi.fn()
const mockDJBallotFindFirst = vi.fn()
const mockDJBallotFindMany = vi.fn()

const mockPrisma = {
  fanVote: {
    create: mockFanVoteCreate,
    findMany: mockFanVoteFindMany,
    aggregate: mockFanVoteAggregate,
  },
  djBallot: {
    create: mockDJBallotCreate,
    findFirst: mockDJBallotFindFirst,
    findMany: mockDJBallotFindMany,
  },
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-001'
const PERIOD_ID = 'period-uuid-001'
const RELEASE_ID = 'release-uuid-001'
const CATEGORY_ID = 'track'

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VoteRepository.getRemainingCredits', () => {
  it('returns MONTHLY_CREDIT_BUDGET when no votes have been cast', async () => {
    mockFanVoteAggregate.mockResolvedValue({ _sum: { creditsSpent: null } })

    const repo = new VoteRepository(mockPrisma as never)
    const remaining = await repo.getRemainingCredits(USER_ID, PERIOD_ID)

    expect(remaining).toBe(MONTHLY_CREDIT_BUDGET)
  })

  it('subtracts spent credits from the budget', async () => {
    mockFanVoteAggregate.mockResolvedValue({ _sum: { creditsSpent: 50 } })

    const repo = new VoteRepository(mockPrisma as never)
    const remaining = await repo.getRemainingCredits(USER_ID, PERIOD_ID)

    expect(remaining).toBe(MONTHLY_CREDIT_BUDGET - 50)
  })

  it('clamps remaining credits to 0 when budget is exceeded', async () => {
    mockFanVoteAggregate.mockResolvedValue({ _sum: { creditsSpent: 200 } })

    const repo = new VoteRepository(mockPrisma as never)
    const remaining = await repo.getRemainingCredits(USER_ID, PERIOD_ID)

    expect(remaining).toBe(0)
  })
})

describe('VoteRepository.createFanVote', () => {
  it('creates a fan vote with correct data', async () => {
    const created = {
      id: 'vote-id-001',
      userId: USER_ID,
      releaseId: RELEASE_ID,
      categoryId: CATEGORY_ID,
      periodId: PERIOD_ID,
      votes: 3,
      creditsSpent: 9,
      createdAt: new Date(),
    }

    mockFanVoteCreate.mockResolvedValue(created)

    const repo = new VoteRepository(mockPrisma as never)
    const result = await repo.createFanVote({
      userId: USER_ID,
      releaseId: RELEASE_ID,
      categoryId: CATEGORY_ID,
      periodId: PERIOD_ID,
      votes: 3,
      creditsSpent: 9,
    })

    expect(result).toEqual(created)
    expect(mockFanVoteCreate).toHaveBeenCalledOnce()
  })
})

describe('VoteRepository.createDJBallot', () => {
  it('creates a DJ ballot when none exists', async () => {
    mockDJBallotFindFirst.mockResolvedValue(null)

    const created = {
      id: 'ballot-id-001',
      userId: USER_ID,
      categoryId: CATEGORY_ID,
      periodId: PERIOD_ID,
      rankings: ['release-1', 'release-2', 'release-3'],
      createdAt: new Date(),
    }

    mockDJBallotCreate.mockResolvedValue(created)

    const repo = new VoteRepository(mockPrisma as never)
    const result = await repo.createDJBallot({
      userId: USER_ID,
      categoryId: CATEGORY_ID,
      periodId: PERIOD_ID,
      rankings: ['release-1', 'release-2', 'release-3'],
    })

    expect(result).toEqual(created)
  })

  it('throws when DJ already submitted a ballot for this category', async () => {
    mockDJBallotFindFirst.mockResolvedValue({ id: 'existing-ballot-id' })

    const repo = new VoteRepository(mockPrisma as never)

    await expect(
      repo.createDJBallot({
        userId: USER_ID,
        categoryId: CATEGORY_ID,
        periodId: PERIOD_ID,
        rankings: ['release-1'],
      }),
    ).rejects.toThrow(/already submitted/)
  })
})

describe('VoteRepository.getUserVotesForPeriod', () => {
  it('returns votes for the user in the given period', async () => {
    const votes = [
      {
        id: 'vote-1',
        userId: USER_ID,
        releaseId: RELEASE_ID,
        categoryId: CATEGORY_ID,
        periodId: PERIOD_ID,
        votes: 3,
        creditsSpent: 9,
        createdAt: new Date(),
      },
    ]

    mockFanVoteFindMany.mockResolvedValue(votes)

    const repo = new VoteRepository(mockPrisma as never)
    const result = await repo.getUserVotesForPeriod(USER_ID, PERIOD_ID)

    expect(result).toEqual(votes)
    expect(mockFanVoteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, periodId: PERIOD_ID, releaseId: { not: null } },
      }),
    )
  })
})
