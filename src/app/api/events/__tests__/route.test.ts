import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockGetUser, mockFindRoleById } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindRoleById: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}))

vi.mock('@/infrastructure/repositories', () => ({
  PrismaUserRepository: class {
    findRoleById = mockFindRoleById
  },
}))

import { POST } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/events', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID_EVENT = {
  name: 'Dark Wave Festival',
  venue: 'Club Gothic',
  city: 'Berlin',
  country: 'Germany',
  date: '2026-06-15T20:00:00Z',
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/events – role authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest(VALID_EVENT))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has FAN role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'FAN' })

    const res = await POST(postRequest(VALID_EVENT))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user has DJ role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'DJ' })

    const res = await POST(postRequest(VALID_EVENT))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user has BAND role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'BAND' })

    const res = await POST(postRequest(VALID_EVENT))
    expect(res.status).toBe(403)
  })

  it.each(['ADMIN', 'EDITOR'] as const)(
    'allows %s role to create an event',
    async (role) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindRoleById.mockResolvedValue({ role })

      const res = await POST(postRequest(VALID_EVENT))
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
    },
  )

  it('returns 400 for invalid body with valid role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'ADMIN' })

    const res = await POST(postRequest({ name: '' }))
    expect(res.status).toBe(400)
  })
})
