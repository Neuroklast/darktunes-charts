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

import { GET, PUT, POST } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRequest(): NextRequest {
  return new NextRequest('http://localhost/api/bot-detection', { method: 'GET' })
}

function putRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/bot-detection', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/bot-detection', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/bot-detection – admin only', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await GET(getRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has FAN role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'FAN' })

    const res = await GET(getRequest())
    expect(res.status).toBe(403)
  })

  it('allows ADMIN to view alerts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'ADMIN' })

    const res = await GET(getRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('alerts')
  })
})

describe('PUT /api/bot-detection – admin only', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await PUT(putRequest({ alertId: '00000000-0000-0000-0000-000000000000', status: 'CLEARED' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has DJ role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'DJ' })

    const res = await PUT(putRequest({ alertId: '00000000-0000-0000-0000-000000000000', status: 'CLEARED' }))
    expect(res.status).toBe(403)
  })

  it('allows ADMIN to update alert', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'ADMIN' })

    const res = await PUT(putRequest({ alertId: '00000000-0000-0000-0000-000000000000', status: 'CLEARED' }))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/bot-detection – any authenticated user', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const body = { type: 'behavior', data: { voteIntervals: [100], sessionDurationMs: 5000, voteCount: 1, hasMouseOrScrollEvents: true, uniqueIpCount: 1 } }
    const res = await POST(postRequest(body))
    expect(res.status).toBe(401)
  })

  it.each(['FAN', 'DJ', 'BAND', 'ADMIN'] as const)(
    'allows %s role to submit analysis',
    async (role) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindRoleById.mockResolvedValue({ role })

      const body = { type: 'behavior', data: { voteIntervals: [100], sessionDurationMs: 5000, voteCount: 1, hasMouseOrScrollEvents: true, uniqueIpCount: 1 } }
      const res = await POST(postRequest(body))
      expect(res.status).toBe(200)
    },
  )

  it('returns 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'FAN' })

    const res = await POST(postRequest({ invalid: true }))
    expect(res.status).toBe(400)
  })
})
