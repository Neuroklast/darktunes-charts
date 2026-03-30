import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockGetUser, mockFindRoleById, mockFindEarnedByUserId } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindRoleById: vi.fn(),
  mockFindEarnedByUserId: vi.fn(),
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
  PrismaAchievementRepository: class {
    findEarnedByUserId = mockFindEarnedByUserId
  },
  PrismaUserRepository: class {
    findRoleById = mockFindRoleById
  },
}))

import { GET } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRequest(userId?: string): NextRequest {
  const url = userId
    ? `http://localhost/api/achievements?userId=${userId}`
    : 'http://localhost/api/achievements'
  return new NextRequest(url, { method: 'GET' })
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFindEarnedByUserId.mockResolvedValue([])
})

describe('GET /api/achievements – IDOR protection', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await GET(getRequest('some-user'))
    expect(res.status).toBe(401)
  })

  it('returns own achievements without userId param', async () => {
    const authId = 'auth-user-id'
    mockGetUser.mockResolvedValue({ data: { user: { id: authId } }, error: null })

    const res = await GET(getRequest())
    expect(res.status).toBe(200)

    // Should query achievements for the authenticated user
    expect(mockFindEarnedByUserId).toHaveBeenCalledWith(authId)
  })

  it('returns own achievements when userId matches session', async () => {
    const authId = 'auth-user-id'
    mockGetUser.mockResolvedValue({ data: { user: { id: authId } }, error: null })

    const res = await GET(getRequest(authId))
    expect(res.status).toBe(200)
    expect(mockFindEarnedByUserId).toHaveBeenCalledWith(authId)
  })

  it('returns 403 when non-admin requests another user\'s achievements', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'FAN' })

    const res = await GET(getRequest('user-b'))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user not found in DB and requesting other user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null })
    mockFindRoleById.mockResolvedValue(null)

    const res = await GET(getRequest('user-b'))
    expect(res.status).toBe(403)
  })

  it('allows admin to query another user\'s achievements', async () => {
    const targetUserId = 'target-user'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'ADMIN' })

    const res = await GET(getRequest(targetUserId))
    expect(res.status).toBe(200)
    expect(mockFindEarnedByUserId).toHaveBeenCalledWith(targetUserId)
  })
})
