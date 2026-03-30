import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { PrismaUserRole } from '@/domain/auth/profile'

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

import { withAuth } from '../rbac'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/test', method = 'GET'): NextRequest {
  return new NextRequest(url, { method })
}

const successHandler = vi.fn(async (_req: NextRequest, user: { id: string; role: PrismaUserRole }) => {
  return NextResponse.json({ userId: user.id, role: user.role })
})

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('withAuth RBAC middleware', () => {
  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

      const handler = withAuth(['ADMIN'], successHandler)
      const res = await handler(makeRequest())

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
      expect(successHandler).not.toHaveBeenCalled()
    })

    it('returns 401 when auth error occurs', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Token expired' } })

      const handler = withAuth([], successHandler)
      const res = await handler(makeRequest())

      expect(res.status).toBe(401)
    })
  })

  describe('authorization – role enforcement', () => {
    it('returns 403 when user is not found in database', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindRoleById.mockResolvedValue(null)

      const handler = withAuth(['ADMIN'], successHandler)
      const res = await handler(makeRequest())

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Forbidden')
    })

    it('returns 403 when user role is not in allowed list', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindRoleById.mockResolvedValue({ role: 'FAN' as PrismaUserRole })

      const handler = withAuth(['ADMIN', 'EDITOR'], successHandler)
      const res = await handler(makeRequest())

      expect(res.status).toBe(403)
    })

    it.each(['ADMIN', 'EDITOR'] as const)(
      'allows %s role when in allowed list [ADMIN, EDITOR]',
      async (role) => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
        mockFindRoleById.mockResolvedValue({ role })

        const handler = withAuth(['ADMIN', 'EDITOR'], successHandler)
        const res = await handler(makeRequest())

        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.userId).toBe('u1')
        expect(json.role).toBe(role)
      },
    )
  })

  describe('authentication-only mode (empty roles)', () => {
    it.each(['FAN', 'DJ', 'BAND', 'EDITOR', 'ADMIN', 'AR', 'LABEL'] as const)(
      'allows any authenticated user with %s role when roles array is empty',
      async (role) => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
        mockFindRoleById.mockResolvedValue({ role })

        const handler = withAuth([], successHandler)
        const res = await handler(makeRequest())

        expect(res.status).toBe(200)
      },
    )
  })

  describe('error handling', () => {
    it('returns 500 when handler throws', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindRoleById.mockResolvedValue({ role: 'ADMIN' as PrismaUserRole })

      const throwingHandler = vi.fn(async () => {
        throw new Error('Handler crash')
      })

      const handler = withAuth(['ADMIN'], throwingHandler)
      const res = await handler(makeRequest())

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Handler crash')
    })
  })

  describe('passes correct arguments to handler', () => {
    it('passes request and user context', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
      mockFindRoleById.mockResolvedValue({ role: 'ADMIN' as PrismaUserRole })

      const handler = withAuth(['ADMIN'], successHandler)
      const req = makeRequest('http://localhost/api/test?foo=bar')
      await handler(req)

      expect(successHandler).toHaveBeenCalledWith(req, { id: 'user-123', role: 'ADMIN' })
    })
  })
})
