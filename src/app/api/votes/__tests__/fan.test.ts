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

import { POST } from '../fan/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TRACK_A = '11111111-1111-1111-1111-111111111111'
const TRACK_B = '22222222-2222-2222-2222-222222222222'
const PERIOD  = '33333333-3333-3333-3333-333333333333'

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/votes/fan', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const AUTHENTICATED_USER = { id: 'fan-user-id' }

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/votes/fan – authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest({ votes: [] }))
    expect(res.status).toBe(401)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })
})

describe('POST /api/votes/fan – request validation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 400 for missing votes field', async () => {
    const res = await POST(postRequest({}))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Invalid request body')
  })

  it('returns 400 for votes with non-UUID trackId', async () => {
    const res = await POST(postRequest({
      votes: [{ trackId: 'not-a-uuid', votes: 3, periodId: PERIOD }],
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when a vote count exceeds the per-track maximum (10)', async () => {
    const res = await POST(postRequest({
      votes: [{ trackId: TRACK_A, votes: 11, periodId: PERIOD }],
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when votes array exceeds 50 entries', async () => {
    const votes = Array.from({ length: 51 }, (_, i) => ({
      trackId: `${String(i).padStart(8, '0')}-0000-0000-0000-000000000000`,
      votes: 1,
      periodId: PERIOD,
    }))
    const res = await POST(postRequest({ votes }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/votes/fan – domain: quadratic credit validation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 200 for valid votes within budget (cost = 1² + 1² = 2 credits)', async () => {
    const res = await POST(postRequest({
      votes: [
        { trackId: TRACK_A, votes: 1, periodId: PERIOD },
        { trackId: TRACK_B, votes: 1, periodId: PERIOD },
      ],
    }))
    expect(res.status).toBe(200)

    const body = await res.json() as { success: boolean; totalCreditsSpent: number }
    expect(body.success).toBe(true)
    expect(body.totalCreditsSpent).toBe(2)
  })

  it('returns 200 with correct cost for 10 votes on one track (cost = 10² = 100 credits)', async () => {
    const res = await POST(postRequest({
      votes: [{ trackId: TRACK_A, votes: 10, periodId: PERIOD }],
    }))
    expect(res.status).toBe(200)

    const body = await res.json() as { success: boolean; totalCreditsSpent: number }
    expect(body.totalCreditsSpent).toBe(100)
  })

  it('returns 422 when total quadratic cost exceeds 150-credit budget', async () => {
    // 10² + 5² = 125 is valid; 11² + 5² = 146 is valid; 12² + 3² = 153 > 150
    const res = await POST(postRequest({
      votes: [
        { trackId: TRACK_A, votes: 12, periodId: PERIOD },
        { trackId: TRACK_B, votes: 3, periodId: PERIOD },
      ],
    }))
    expect(res.status).toBe(422)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/budget exceeded/i)
  })

  it('returns 200 for empty votes array (zero credits spent)', async () => {
    const res = await POST(postRequest({ votes: [] }))
    expect(res.status).toBe(200)

    const body = await res.json() as { success: boolean; totalCreditsSpent: number }
    expect(body.success).toBe(true)
    expect(body.totalCreditsSpent).toBe(0)
  })
})
