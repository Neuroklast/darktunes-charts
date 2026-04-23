import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockGetUser, mockFindRoleById, mockBandFindMany } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindRoleById: vi.fn(),
  mockBandFindMany: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    band: { findMany: mockBandFindMany },
  },
}))

vi.mock('@/infrastructure/repositories', () => ({
  PrismaUserRepository: class {
    findRoleById = mockFindRoleById
  },
}))

import { GET } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRequest(): NextRequest {
  return new NextRequest('http://localhost/api/export', { method: 'GET' })
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockBandFindMany.mockResolvedValue([])
})

describe('GET /api/export – role authorization', () => {
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

  it('returns 403 when user has DJ role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'DJ' })

    const res = await GET(getRequest())
    expect(res.status).toBe(403)
  })

  it.each(['LABEL', 'AR', 'ADMIN'] as const)(
    'allows %s role to export CSV',
    async (role) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindRoleById.mockResolvedValue({ role })

      const res = await GET(getRequest())
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    },
  )
})
