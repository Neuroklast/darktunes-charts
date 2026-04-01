import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Mock the new persistence dependencies so tests stay in-memory
vi.mock('@/infrastructure/repositories/voteRepository', () => ({
  voteRepository: {
    createDJBallot: vi.fn().mockResolvedValue({ id: 'ballot-id-mock' }),
    getUserBallotsForPeriod: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/infrastructure/repositories/votingPeriodRepository', () => ({
  votingPeriodRepository: {
    findActive: vi.fn().mockResolvedValue({ id: 'period-id-mock' }),
  },
}))

vi.mock('@/infrastructure/audit', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/infrastructure/rateLimiter', () => ({
  rateLimiter: {
    check: vi.fn().mockReturnValue({ allowed: true, remaining: 59, resetAt: Date.now() + 60_000 }),
  },
  VOTE_RATE_LIMIT: 60,
  VOTE_RATE_WINDOW_MS: 60_000,
}))

import { POST } from '../dj/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD   = '33333333-3333-3333-3333-333333333333'
const CAND_A   = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const CAND_B   = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const CAND_C   = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/votes/dj', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const AUTHENTICATED_USER = { id: 'dj-user-id' }

const VALID_BODY = {
  periodId: PERIOD,
  genre: 'Dark Wave',
  rankings: [CAND_A, CAND_B, CAND_C],
  candidates: [CAND_A, CAND_B, CAND_C],
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/votes/dj – authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(401)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })
})

describe('POST /api/votes/dj – request validation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 400 when periodId is missing', async () => {
    const { periodId: _omit, ...bodyWithoutPeriodId } = VALID_BODY
    const res = await POST(postRequest(bodyWithoutPeriodId))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Invalid request body')
  })

  it('returns 400 when rankings array is empty', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, rankings: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when candidates array is empty', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, candidates: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when rankings contains non-UUID values', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, rankings: ['not-a-uuid'] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when candidates contains non-UUID values', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, candidates: ['not-a-uuid'] }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/votes/dj – domain: Schulze method calculation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 200 with schulzeResult containing rankings array', async () => {
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json() as { success: boolean; schulzeResult: { rankings: string[] } }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.schulzeResult.rankings)).toBe(true)
    expect(body.schulzeResult.rankings).toHaveLength(3)
  })

  it('places the top-ranked candidate first (single ballot)', async () => {
    const res = await POST(postRequest({
      ...VALID_BODY,
      rankings: [CAND_A, CAND_B, CAND_C],
      candidates: [CAND_A, CAND_B, CAND_C],
    }))
    expect(res.status).toBe(200)

    const body = await res.json() as { schulzeResult: { rankings: string[] } }
    expect(body.schulzeResult.rankings[0]).toBe(CAND_A)
  })

  it('returns pairwiseMatrix and strongestPathMatrix in the result', async () => {
    const res = await POST(postRequest(VALID_BODY))
    const body = await res.json() as {
      schulzeResult: {
        pairwiseMatrix: number[][]
        strongestPathMatrix: number[][]
        candidates: string[]
      }
    }
    expect(Array.isArray(body.schulzeResult.pairwiseMatrix)).toBe(true)
    expect(Array.isArray(body.schulzeResult.strongestPathMatrix)).toBe(true)
    expect(Array.isArray(body.schulzeResult.candidates)).toBe(true)
  })

  it('ignores ranking entries that are not in the candidates list', async () => {
    const UNKNOWN = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    const res = await POST(postRequest({
      ...VALID_BODY,
      rankings: [CAND_A, CAND_B, UNKNOWN],
      candidates: [CAND_A, CAND_B, CAND_C],
    }))
    expect(res.status).toBe(200)
    const body = await res.json() as { schulzeResult: { candidates: string[] } }
    expect(body.schulzeResult.candidates).toHaveLength(3)
  })
})
