import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockGetUser, mockCreateCheckoutSession, mockBandFindUnique } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateCheckoutSession: vi.fn(),
  mockBandFindUnique: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/infrastructure/payment/stripeAdapter', () => ({
  createCheckoutSession: mockCreateCheckoutSession,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    band: { findUnique: mockBandFindUnique },
  },
}))

import { POST } from '../checkout/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

const BAND_ID  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const OWNER_ID = 'band-user-id'
const ORIGIN   = 'https://darktunes.com'

function postRequest(body: Record<string, unknown>, origin = ORIGIN): NextRequest {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'origin': origin,
    },
  })
}

const VALID_BODY = {
  bandId: BAND_ID,
  tier: 'Emerging' as const,
  totalCategories: 3,
}

const AUTHENTICATED_USER = { id: OWNER_ID }

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateCheckoutSession.mockResolvedValue({
    sessionId: 'cs_test_123',
    sessionUrl: `${ORIGIN}/dashboard/band?payment=success`,
  })
  // Default: band exists and is owned by the authenticated user
  mockBandFindUnique.mockResolvedValue({ ownerId: OWNER_ID })
})

describe('POST /api/stripe/checkout – origin validation', () => {
  it('returns 400 when Origin header is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/missing origin/i)
  })

  it('allows requests when STRIPE_ALLOWED_ORIGINS is not set (open)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
    delete process.env['STRIPE_ALLOWED_ORIGINS']

    const res = await POST(postRequest(VALID_BODY, 'https://any-origin.com'))
    // Without env var the origin allowlist is empty → all origins pass
    expect(res.status).toBe(200)
  })
})

describe('POST /api/stripe/checkout – authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(401)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })
})

describe('POST /api/stripe/checkout – band ownership', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 404 when band does not exist', async () => {
    mockBandFindUnique.mockResolvedValue(null)

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(404)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 403 when authenticated user does not own the band', async () => {
    mockBandFindUnique.mockResolvedValue({ ownerId: 'someone-else' })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(403)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/do not own/i)
  })
})

describe('POST /api/stripe/checkout – request validation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 400 for missing bandId', async () => {
    const { bandId: _omit, ...noBand } = VALID_BODY
    const res = await POST(postRequest(noBand))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Invalid request body')
  })

  it('returns 400 for invalid tier value', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, tier: 'Unknown' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when totalCategories is less than 2', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, totalCategories: 1 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when bandId is not a UUID', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, bandId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/stripe/checkout – domain: session creation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
  })

  it('returns 200 with sessionId and sessionUrl on success', async () => {
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const body = await res.json() as { sessionId: string; sessionUrl: string }
    expect(body.sessionId).toBe('cs_test_123')
    expect(body.sessionUrl).toContain('payment=success')
  })

  it('passes correct parameters to createCheckoutSession', async () => {
    await POST(postRequest(VALID_BODY))

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        bandId: BAND_ID,
        tier: 'Emerging',
        totalCategories: 3,
        successUrl: expect.stringContaining('payment=success'),
        cancelUrl: expect.stringContaining('payment=cancelled'),
      })
    )
  })

  it('returns 500 when createCheckoutSession throws', async () => {
    mockCreateCheckoutSession.mockRejectedValue(new Error('Stripe API unavailable'))

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(500)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Stripe API unavailable')
  })
})
