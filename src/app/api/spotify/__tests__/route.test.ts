import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockGetMonthlyListeners } = vi.hoisted(() => ({
  mockGetMonthlyListeners: vi.fn(),
}))

vi.mock('@/infrastructure/api/spotifyAdapter', () => ({
  getMonthlyListeners: mockGetMonthlyListeners,
}))

import { GET } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRequest(artistId?: string): NextRequest {
  const url = artistId
    ? `http://localhost/api/spotify?artistId=${artistId}`
    : 'http://localhost/api/spotify'
  return new NextRequest(url, { method: 'GET' })
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMonthlyListeners.mockResolvedValue({ monthlyListeners: 50000 })
})

describe('GET /api/spotify – input validation', () => {
  it('returns 400 when artistId is missing', async () => {
    const res = await GET(getRequest())
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('artistId parameter required')
  })

  it('returns 400 for too-short artistId', async () => {
    const res = await GET(getRequest('abc'))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Invalid artistId format')
  })

  it('returns 400 for too-long artistId', async () => {
    const res = await GET(getRequest('a'.repeat(30)))
    expect(res.status).toBe(400)
  })

  it('returns 400 for artistId with special characters', async () => {
    const res = await GET(getRequest('abc!@#$%^&*()_+defghij'))
    expect(res.status).toBe(400)
  })

  it('accepts valid 22-char base-62 artistId', async () => {
    const validId = '6sFIWsNpZYqfjUpaCgueju' // Example Spotify ID (Cardi B)
    const res = await GET(getRequest(validId))
    expect(res.status).toBe(200)
    expect(mockGetMonthlyListeners).toHaveBeenCalledWith(validId)
  })

  it('accepts another valid Spotify artist ID', async () => {
    const validId = '0TnOYISbd1XYRBk9myaseg' // Example (Pitbull)
    const res = await GET(getRequest(validId))
    expect(res.status).toBe(200)
  })
})
