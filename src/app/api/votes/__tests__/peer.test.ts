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

import { POST } from '../peer/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

const VOTER_ID  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const BAND_ID   = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const PERIOD    = '33333333-3333-3333-3333-333333333333'

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/votes/peer', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID_BODY = {
  votedBandId: BAND_ID,
  periodId: PERIOD,
  rawWeight: 1.0,
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/votes/peer – authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(401)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })
})

describe('POST /api/votes/peer – request validation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: VOTER_ID } }, error: null })
  })

  it('returns 400 when votedBandId is missing', async () => {
    const { votedBandId: _omit, ...bodyWithoutVotedBandId } = VALID_BODY
    const res = await POST(postRequest(bodyWithoutVotedBandId))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Invalid request body')
  })

  it('returns 400 when votedBandId is not a UUID', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, votedBandId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when periodId is not a UUID', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, periodId: 'bad' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when rawWeight exceeds 1.0', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, rawWeight: 1.5 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when rawWeight is negative', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, rawWeight: -0.1 }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/votes/peer – domain: self-vote prevention', () => {
  it('returns 422 when a band votes for itself', async () => {
    // The authenticated user IS the band they are voting for
    mockGetUser.mockResolvedValue({ data: { user: { id: BAND_ID } }, error: null })

    const res = await POST(postRequest({ ...VALID_BODY, votedBandId: BAND_ID }))
    expect(res.status).toBe(422)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/cannot vote for themselves/i)
  })
})

describe('POST /api/votes/peer – domain: clique coefficient', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: VOTER_ID } }, error: null })
  })

  it('returns 200 with cliqueCoefficient and finalWeight for a clean vote', async () => {
    // No historical votes loaded (fresh Map) → no reciprocity → coefficient = 1.0
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json() as {
      success: boolean
      cliqueCoefficient: number
      finalWeight: number
    }
    expect(body.success).toBe(true)
    expect(body.cliqueCoefficient).toBe(1.0)
    expect(body.finalWeight).toBeCloseTo(1.0)
  })

  it('applies rawWeight to the final vote weight', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, rawWeight: 0.5 }))
    expect(res.status).toBe(200)

    const body = await res.json() as { finalWeight: number; cliqueCoefficient: number }
    // coefficient = 1.0 (no clique), rawWeight = 0.5 → finalWeight = 0.5
    expect(body.finalWeight).toBeCloseTo(0.5)
  })

  it('defaults rawWeight to 1.0 when not supplied', async () => {
    const { rawWeight: _omit, ...noWeight } = VALID_BODY
    const res = await POST(postRequest(noWeight))
    expect(res.status).toBe(200)

    const body = await res.json() as { finalWeight: number }
    expect(body.finalWeight).toBeCloseTo(1.0)
  })
})
