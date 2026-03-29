/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  requireAuth,
  requireRole,
  validateUserOwnership,
  withCORS,
  handleCORSPreflight,
  CORS_HEADERS,
} from '../rbac'
import type { UserRole } from '@/lib/types'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('RBAC Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should return error when user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      } as never)

      const result = await requireAuth()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(401)
        const body = await result.response.json()
        expect(body.error).toContain('Unauthorized')
      }
    })

    it('should return error when user profile not found in database', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await requireAuth()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(401)
        const body = await result.response.json()
        expect(body.error).toContain('User profile not found')
      }
    })

    it('should return authenticated user when valid', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'FAN',
      } as never)

      const result = await requireAuth()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.user.id).toBe('user-123')
        expect(result.user.email).toBe('test@example.com')
        expect(result.user.role).toBe('fan')
        expect(result.user.dbRole).toBe('FAN')
      }
    })
  })

  describe('requireRole', () => {
    it('should return error when user lacks required role', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'FAN',
      } as never)

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await requireRole(request, ['admin', 'editor'])

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(403)
        const body = await result.response.json()
        expect(body.error).toContain('Forbidden')
        expect(body.required).toEqual(['admin', 'editor'])
        expect(body.actual).toBe('fan')
      }
    })

    it('should return user when role is allowed', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const { prisma } = await import('@/lib/prisma')

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-123', email: 'admin@example.com' } },
            error: null,
          }),
        },
      } as never)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      } as never)

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await requireRole(request, ['admin', 'editor'])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.user.role).toBe('admin')
      }
    })
  })

  describe('validateUserOwnership', () => {
    it('should return false when requestedUserId is null', () => {
      expect(validateUserOwnership('user-123', null)).toBe(false)
    })

    it('should return false when requestedUserId is undefined', () => {
      expect(validateUserOwnership('user-123', undefined)).toBe(false)
    })

    it('should return false when IDs do not match', () => {
      expect(validateUserOwnership('user-123', 'user-456')).toBe(false)
    })

    it('should return true when IDs match', () => {
      expect(validateUserOwnership('user-123', 'user-123')).toBe(true)
    })
  })

  describe('CORS helpers', () => {
    it('should add CORS headers to response', async () => {
      const { NextResponse } = await import('next/server')
      const response = NextResponse.json({ data: 'test' })
      const corsResponse = withCORS(response)

      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        expect(corsResponse.headers.get(key)).toBe(value)
      })
    })

    it('should handle CORS preflight', () => {
      const response = handleCORSPreflight()

      expect(response.status).toBe(200)
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        expect(response.headers.get(key)).toBe(value)
      })
    })
  })
})
