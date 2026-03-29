import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '../rbac'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Import mocked modules
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const mockedCreateClient = vi.mocked(createClient)
const mockedPrisma = vi.mocked(prisma)

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createMockRequest(url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url)
}

function mockAuthSuccess(
  userId = 'user-123',
  email = 'test@example.com',
): void {
  mockedCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId, email } },
        error: null,
      }),
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>)
}

function mockAuthFailure(): void {
  mockedCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      }),
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>)
}

function mockDbUser(role: string): void {
  (mockedPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
    role,
  })
}

function mockDbUserNotFound(): void {
  (mockedPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('withAuth RBAC middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockAuthFailure()

      const handler = withAuth([], async () => NextResponse.json({ ok: true }))
      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when user profile not found in database', async () => {
      mockAuthSuccess()
      mockDbUserNotFound()

      const handler = withAuth([], async () => NextResponse.json({ ok: true }))
      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toContain('user profile not found')
    })

    it('passes authenticated user to handler when session is valid', async () => {
      mockAuthSuccess('user-abc', 'admin@darktunes.com')
      mockDbUser('ADMIN')

      let receivedUser: AuthenticatedUser | null = null

      const handler = withAuth([], async (_req, user) => {
        receivedUser = user
        return NextResponse.json({ userId: user.id })
      })

      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.userId).toBe('user-abc')
      expect(receivedUser).toEqual({
        id: 'user-abc',
        role: 'admin',
        email: 'admin@darktunes.com',
      })
    })
  })

  describe('role-based authorization', () => {
    it('allows access when no roles are specified (any authenticated user)', async () => {
      mockAuthSuccess()
      mockDbUser('FAN')

      const handler = withAuth([], async () => NextResponse.json({ ok: true }))
      const response = await handler(createMockRequest())

      expect(response.status).toBe(200)
    })

    it('allows access when user has an allowed role', async () => {
      mockAuthSuccess()
      mockDbUser('ADMIN')

      const handler = withAuth(
        ['admin', 'editor'],
        async () => NextResponse.json({ ok: true }),
      )
      const response = await handler(createMockRequest())

      expect(response.status).toBe(200)
    })

    it('returns 403 when user role is not in allowed roles', async () => {
      mockAuthSuccess()
      mockDbUser('FAN')

      const handler = withAuth(
        ['admin'],
        async () => NextResponse.json({ ok: true }),
      )
      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.error).toContain('insufficient permissions')
    })

    it('correctly maps all Prisma roles to domain roles', async () => {
      const roleMappings: Array<{ prisma: string; domain: string }> = [
        { prisma: 'FAN', domain: 'fan' },
        { prisma: 'DJ', domain: 'dj' },
        { prisma: 'BAND', domain: 'band' },
        { prisma: 'EDITOR', domain: 'editor' },
        { prisma: 'ADMIN', domain: 'admin' },
        { prisma: 'AR', domain: 'ar' },
        { prisma: 'LABEL', domain: 'label' },
      ]

      for (const mapping of roleMappings) {
        vi.clearAllMocks()
        mockAuthSuccess()
        mockDbUser(mapping.prisma)

        let capturedRole = ''
        const handler = withAuth([], async (_req, user) => {
          capturedRole = user.role
          return NextResponse.json({ role: user.role })
        })

        await handler(createMockRequest())
        expect(capturedRole).toBe(mapping.domain)
      }
    })
  })

  describe('role-specific endpoint access', () => {
    it('ADMIN can access admin-only endpoints', async () => {
      mockAuthSuccess()
      mockDbUser('ADMIN')

      const handler = withAuth(['admin'], async () => NextResponse.json({ ok: true }))
      const response = await handler(createMockRequest())

      expect(response.status).toBe(200)
    })

    it('FAN cannot access admin-only endpoints', async () => {
      mockAuthSuccess()
      mockDbUser('FAN')

      const handler = withAuth(['admin'], async () => NextResponse.json({ ok: true }))
      const response = await handler(createMockRequest())

      expect(response.status).toBe(403)
    })

    it('BAND can access band+label endpoints', async () => {
      mockAuthSuccess()
      mockDbUser('BAND')

      const handler = withAuth(
        ['band', 'label'],
        async () => NextResponse.json({ ok: true }),
      )
      const response = await handler(createMockRequest())

      expect(response.status).toBe(200)
    })

    it('LABEL can access label+ar+admin endpoints', async () => {
      mockAuthSuccess()
      mockDbUser('LABEL')

      const handler = withAuth(
        ['label', 'ar', 'admin'],
        async () => NextResponse.json({ ok: true }),
      )
      const response = await handler(createMockRequest())

      expect(response.status).toBe(200)
    })

    it('DJ cannot access band-only endpoints', async () => {
      mockAuthSuccess()
      mockDbUser('DJ')

      const handler = withAuth(['band'], async () => NextResponse.json({ ok: true }))
      const response = await handler(createMockRequest())

      expect(response.status).toBe(403)
    })
  })

  describe('error handling', () => {
    it('returns 500 when handler throws an error', async () => {
      mockAuthSuccess()
      mockDbUser('ADMIN')

      const handler = withAuth(['admin'], async () => {
        throw new Error('Database connection failed')
      })

      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toBe('Database connection failed')
    })

    it('returns generic error message for non-Error throws', async () => {
      mockAuthSuccess()
      mockDbUser('ADMIN')

      const handler = withAuth(['admin'], async () => {
        throw 'some string error'
      })

      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toBe('Internal server error')
    })
  })
})
