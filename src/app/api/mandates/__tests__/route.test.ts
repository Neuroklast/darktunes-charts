import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { PrismaUserRole } from '@/domain/auth/profile'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  ),
}))

const mockFindUnique = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authedUser(id = 'user-1') {
  mockGetUser.mockResolvedValue({
    data: { user: { id } },
    error: null,
  })
}

function unauthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

function dbUserWithRole(role: PrismaUserRole) {
  mockFindUnique.mockResolvedValue({ role })
}

function dbUserNotFound() {
  mockFindUnique.mockResolvedValue(null)
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/mandates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(mandateId?: string): NextRequest {
  const url = mandateId
    ? `http://localhost/api/mandates?mandateId=${mandateId}`
    : 'http://localhost/api/mandates'
  return new NextRequest(url, { method: 'DELETE' })
}

const VALID_MANDATE_BODY = {
  labelId: '00000000-0000-0000-0000-000000000001',
  bandId: '00000000-0000-0000-0000-000000000002',
}

const VALID_MANDATE_ID = '00000000-0000-0000-0000-000000000099'

// ─── Tests ────────────────────────────────────────────────────────────────────

let POST: typeof import('../route').POST
let DELETE: typeof import('../route').DELETE

beforeEach(async () => {
  vi.clearAllMocks()
  // Re-import to reset module state
  const mod = await import('../route')
  POST = mod.POST
  DELETE = mod.DELETE
})

// ── POST /api/mandates ──────────────────────────────────────────────────────

describe('POST /api/mandates', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser()
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 401 when user has no DB profile', async () => {
    authedUser()
    dbUserNotFound()
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user role is FAN', async () => {
    authedUser()
    dbUserWithRole('FAN')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('error.mandate.grant_forbidden')
  })

  it('returns 403 when user role is DJ', async () => {
    authedUser()
    dbUserWithRole('DJ')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is EDITOR', async () => {
    authedUser()
    dbUserWithRole('EDITOR')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is LABEL', async () => {
    authedUser()
    dbUserWithRole('LABEL')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is AR', async () => {
    authedUser()
    dbUserWithRole('AR')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is ADMIN', async () => {
    authedUser()
    dbUserWithRole('ADMIN')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(403)
  })

  it('allows BAND role and returns success', async () => {
    authedUser()
    dbUserWithRole('BAND')
    const res = await POST(makePostRequest(VALID_MANDATE_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.mandate.status).toBe('PENDING')
  })

  it('returns 400 for invalid body when role is BAND', async () => {
    authedUser()
    dbUserWithRole('BAND')
    const res = await POST(makePostRequest({ labelId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid request body')
  })
})

// ── DELETE /api/mandates ────────────────────────────────────────────────────

describe('DELETE /api/mandates', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser()
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 401 when user has no DB profile', async () => {
    authedUser()
    dbUserNotFound()
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user role is FAN', async () => {
    authedUser()
    dbUserWithRole('FAN')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('error.mandate.revoke_forbidden')
  })

  it('returns 403 when user role is DJ', async () => {
    authedUser()
    dbUserWithRole('DJ')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is EDITOR', async () => {
    authedUser()
    dbUserWithRole('EDITOR')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is AR', async () => {
    authedUser()
    dbUserWithRole('AR')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user role is ADMIN', async () => {
    authedUser()
    dbUserWithRole('ADMIN')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)
  })

  it('allows BAND role and returns success', async () => {
    authedUser()
    dbUserWithRole('BAND')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('allows LABEL role and returns success', async () => {
    authedUser()
    dbUserWithRole('LABEL')
    const res = await DELETE(makeDeleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 when mandateId is missing for BAND', async () => {
    authedUser()
    dbUserWithRole('BAND')
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('mandateId parameter required')
  })

  it('returns 400 when mandateId is missing for LABEL', async () => {
    authedUser()
    dbUserWithRole('LABEL')
    const res = await DELETE(makeDeleteRequest())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('mandateId parameter required')
  })
})
