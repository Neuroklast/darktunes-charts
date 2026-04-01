/**
 * @module app/api/v1/__tests__/publicApi.test
 *
 * Integration-style unit tests for the public v1 API routes.
 *
 * API key authentication is mocked at the `apiKeyAuth` module boundary.
 * Prisma calls are mocked to return deterministic fixture data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockValidateApiKey } = vi.hoisted(() => ({
  mockValidateApiKey: vi.fn(),
}))

const { mockBandFindMany, mockBandCount, mockUserCount, mockVotingPeriodFindFirst } = vi.hoisted(
  () => ({
    mockBandFindMany: vi.fn(),
    mockBandCount: vi.fn(),
    mockUserCount: vi.fn(),
    mockVotingPeriodFindFirst: vi.fn(),
  }),
)

vi.mock('@/lib/apiKeyAuth', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/apiKeyAuth')>()
  return {
    ...original,
    validateApiKey: mockValidateApiKey,
    withApiKey: (
      handler: (req: NextRequest, ctx: { partnerId: string; permissions: string[]; rateLimit: number }) => Promise<Response>
    ) =>
      async (request: NextRequest) => {
        const context = await mockValidateApiKey(request)
        if (!context) {
          return Response.json({ error: 'Unauthorized: valid API key required' }, { status: 401 })
        }
        return handler(request, context)
      },
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    band: {
      findMany: mockBandFindMany,
      count: mockBandCount,
      findUnique: vi.fn(),
    },
    user: {
      count: mockUserCount,
    },
    votingPeriod: {
      findFirst: mockVotingPeriodFindFirst,
    },
    chartResult: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    compilation: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

vi.mock('@/domain/genres', () => ({
  GENRE_TAXONOMY: { gothic: { label: 'Gothic', subGenres: ['darkwave', 'gothic-rock'] } },
  getAllGenres: vi.fn().mockReturnValue(['darkwave', 'gothic-rock', 'ebm']),
}))

// ─── Import routes after mocks ────────────────────────────────────────────────

import { GET as getBands } from '../../../api/v1/bands/route'
import { GET as getStats } from '../../../api/v1/stats/route'
import { GET as getGenres } from '../../../api/v1/genres/route'
import { GET as getCharts } from '../../../api/v1/charts/route'
import { GET as getCompilations } from '../../../api/v1/compilations/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validApiKeyContext = {
  partnerId: 'test-partner',
  permissions: ['read:charts'],
  rateLimit: 1000,
}

function makeRequest(url = 'http://localhost/api/v1/bands'): NextRequest {
  return new NextRequest(url)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/v1/bands', () => {
  it('returns 401 when no API key is provided', async () => {
    mockValidateApiKey.mockResolvedValue(null)

    const response = await getBands(makeRequest())
    expect(response.status).toBe(401)

    const body = await response.json() as { error: string }
    expect(body.error).toMatch(/unauthorized/i)
  })

  it('returns paginated band list with valid API key', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)
    mockBandCount.mockResolvedValue(2)
    mockBandFindMany.mockResolvedValue([
      {
        id: 'band-1',
        name: 'Bauhaus',
        slug: 'bauhaus',
        genre: 'GOTH',
        tier: 'ESTABLISHED',
        spotifyMonthlyListeners: 300_000,
        country: 'GB',
      },
    ])

    const response = await getBands(makeRequest())
    expect(response.status).toBe(200)

    const body = await response.json() as { bands: unknown[]; pagination: { total: number } }
    expect(body.bands).toHaveLength(1)
    expect(body.pagination.total).toBe(2)
  })

  it('applies default pagination parameters', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)
    mockBandCount.mockResolvedValue(0)
    mockBandFindMany.mockResolvedValue([])

    await getBands(makeRequest('http://localhost/api/v1/bands'))

    expect(mockBandFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    )
  })

  it('respects page and perPage query params', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)
    mockBandCount.mockResolvedValue(50)
    mockBandFindMany.mockResolvedValue([])

    await getBands(makeRequest('http://localhost/api/v1/bands?page=2&perPage=10'))

    expect(mockBandFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    )
  })
})

describe('GET /api/v1/stats', () => {
  it('returns 401 when no API key is provided', async () => {
    mockValidateApiKey.mockResolvedValue(null)

    const response = await getStats(makeRequest('http://localhost/api/v1/stats'))
    expect(response.status).toBe(401)
  })

  it('returns platform stats with valid API key', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)
    mockBandCount.mockResolvedValue(42)
    mockUserCount.mockResolvedValue(1337)
    mockVotingPeriodFindFirst.mockResolvedValue({
      id: 'period-1',
      name: 'Q1 2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      status: 'OPEN',
    })

    const response = await getStats(makeRequest('http://localhost/api/v1/stats'))
    expect(response.status).toBe(200)

    const body = await response.json() as {
      totalBands: number
      totalVoters: number
      activePeriod: { id: string }
    }
    expect(body.totalBands).toBe(42)
    expect(body.totalVoters).toBe(1337)
    expect(body.activePeriod?.id).toBe('period-1')
  })

  it('returns null activePeriod when no open period exists', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)
    mockBandCount.mockResolvedValue(0)
    mockUserCount.mockResolvedValue(0)
    mockVotingPeriodFindFirst.mockResolvedValue(null)

    const response = await getStats(makeRequest('http://localhost/api/v1/stats'))
    const body = await response.json() as { activePeriod: null }
    expect(body.activePeriod).toBeNull()
  })
})

describe('GET /api/v1/genres', () => {
  it('returns 401 without API key', async () => {
    mockValidateApiKey.mockResolvedValue(null)

    const response = await getGenres(makeRequest('http://localhost/api/v1/genres'))
    expect(response.status).toBe(401)
  })

  it('returns genre taxonomy with valid API key', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)

    const response = await getGenres(makeRequest('http://localhost/api/v1/genres'))
    expect(response.status).toBe(200)

    const body = await response.json() as { genres: string[]; total: number }
    expect(body.genres).toEqual(['darkwave', 'gothic-rock', 'ebm'])
    expect(body.total).toBe(3)
  })
})

describe('GET /api/v1/charts', () => {
  it('returns 401 without API key', async () => {
    mockValidateApiKey.mockResolvedValue(null)

    const response = await getCharts(makeRequest('http://localhost/api/v1/charts'))
    expect(response.status).toBe(401)
  })

  it('returns empty chart list when no results', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)

    const response = await getCharts(makeRequest('http://localhost/api/v1/charts'))
    expect(response.status).toBe(200)

    const body = await response.json() as { charts: unknown[] }
    expect(body.charts).toEqual([])
  })
})

describe('GET /api/v1/compilations', () => {
  it('returns 401 without API key', async () => {
    mockValidateApiKey.mockResolvedValue(null)

    const response = await getCompilations(makeRequest('http://localhost/api/v1/compilations'))
    expect(response.status).toBe(401)
  })

  it('queries only PUBLISHED compilations', async () => {
    mockValidateApiKey.mockResolvedValue(validApiKeyContext)

    // Access the mocked compilation findMany via prisma
    const { prisma } = await import('@/lib/prisma')
    const compilationFindMany = vi.mocked(
      (prisma as unknown as { compilation: { findMany: ReturnType<typeof vi.fn> } })
        .compilation.findMany
    )
    compilationFindMany.mockResolvedValue([
      {
        id: 'comp-1',
        title: 'Dark Nights Vol. 1',
        period: '2025-Q1',
        status: 'PUBLISHED',
        coverArtUrl: null,
        description: null,
        publishedAt: new Date('2025-03-31'),
      },
    ])

    const response = await getCompilations(makeRequest('http://localhost/api/v1/compilations'))
    expect(response.status).toBe(200)

    expect(compilationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED' } }),
    )

    const body = await response.json() as { compilations: Array<{ status: string }> }
    expect(body.compilations).toHaveLength(1)
    expect(body.compilations[0]?.status).toBe('PUBLISHED')
  })
})
