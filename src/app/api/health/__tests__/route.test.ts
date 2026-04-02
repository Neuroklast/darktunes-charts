import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock prisma with a working $queryRaw ─────────────────────────────────────

const { mockQueryRaw } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
  },
}))

import { GET } from '../route'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with status ok when DB is healthy', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ 1: 1 }])

    const response = await GET()
    const data = await response.json() as {
      status: string
      checks: { database: { status: string; latencyMs: number } }
      uptime: number
    }

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.checks.database.status).toBe('ok')
    expect(typeof data.checks.database.latencyMs).toBe('number')
    expect(typeof data.uptime).toBe('number')
  })

  it('returns 503 with status degraded when DB fails', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('Connection refused'))

    const response = await GET()
    const data = await response.json() as {
      status: string
      checks: { database: { status: string; message: string } }
    }

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.checks.database.status).toBe('error')
    expect(data.checks.database.message).toBe('Connection refused')
  })

  it('includes timestamp in ISO format', async () => {
    mockQueryRaw.mockResolvedValueOnce([])

    const response = await GET()
    const data = await response.json() as { timestamp: string }

    expect(() => new Date(data.timestamp)).not.toThrow()
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })
})
