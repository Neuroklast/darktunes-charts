import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockGetUser, mockFindUnique, mockMandateCreate, mockMandateUpdate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindUnique: vi.fn(),
  mockMandateCreate: vi.fn(),
  mockMandateUpdate: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    labelBandMandate: {
      create: mockMandateCreate,
      update: mockMandateUpdate,
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

import { POST, DELETE } from '../route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function postRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/mandates', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function deleteRequest(mandateId?: string): NextRequest {
  const url = mandateId
    ? `http://localhost/api/mandates?mandateId=${mandateId}`
    : 'http://localhost/api/mandates'
  return new NextRequest(url, { method: 'DELETE' })
}

const VALID_BODY = {
  labelId: '11111111-1111-1111-1111-111111111111',
  bandId: '22222222-2222-2222-2222-222222222222',
}

const VALID_MANDATE_ID = '33333333-3333-3333-3333-333333333333'

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockMandateCreate.mockResolvedValue({ id: 'mock-mandate-id' })
  mockMandateUpdate.mockResolvedValue({ id: 'mock-mandate-id' })
})

describe('POST /api/mandates – role validation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has FAN role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindUnique.mockResolvedValue({ role: 'FAN' })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns 403 when user has DJ role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindUnique.mockResolvedValue({ role: 'DJ' })

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user is not found in database', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindUnique.mockResolvedValue(null)

    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it.each(['BAND', 'LABEL', 'ADMIN'] as const)(
    'allows %s role to create a mandate',
    async (role) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindUnique.mockResolvedValue({ role })

      const res = await POST(postRequest(VALID_BODY))
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
    },
  )
})

describe('DELETE /api/mandates – role validation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await DELETE(deleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has FAN role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindUnique.mockResolvedValue({ role: 'FAN' })

    const res = await DELETE(deleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns 403 when user has AR role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindUnique.mockResolvedValue({ role: 'AR' })

    const res = await DELETE(deleteRequest(VALID_MANDATE_ID))
    expect(res.status).toBe(403)
  })

  it.each(['BAND', 'LABEL', 'ADMIN'] as const)(
    'allows %s role to revoke a mandate',
    async (role) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      mockFindUnique.mockResolvedValue({ role })

      const res = await DELETE(deleteRequest(VALID_MANDATE_ID))
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
    },
  )

  it('returns 400 when mandateId is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFindUnique.mockResolvedValue({ role: 'BAND' })

    const res = await DELETE(deleteRequest())
    expect(res.status).toBe(400)
  })
})
