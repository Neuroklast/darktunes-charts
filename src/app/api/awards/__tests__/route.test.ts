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
  return new NextRequest('http://localhost/api/awards', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID_AWARD = {
  title: 'Best Newcomer',
  description: 'Outstanding debut release',
  awardType: 'monthly',
  month: 3,
  year: 2026,
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/awards – role authorization', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest(VALID_AWARD))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has FAN role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'FAN' })

    const res = await POST(postRequest(VALID_AWARD))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user has EDITOR role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'EDITOR' })

    const res = await POST(postRequest(VALID_AWARD))
    expect(res.status).toBe(403)
  })

  it('allows ADMIN role to create an award', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'ADMIN' })

    const res = await POST(postRequest(VALID_AWARD))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 for invalid body with valid role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindRoleById.mockResolvedValue({ role: 'ADMIN' })

    const res = await POST(postRequest({ title: '' }))
    expect(res.status).toBe(400)
  })
})
