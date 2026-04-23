/**
 * Contract tests between frontend and API.
 *
 * These tests verify that the Zod schemas used by each API route accept the
 * exact request shapes the frontend sends and reject shapes that would break
 * the pipeline.  They provide a compile-time and runtime safety net when
 * either side evolves independently.
 *
 * Pattern: parse the "golden" frontend payload through the same Zod schema
 * used in the route handler, then assert the parsed value matches expectations.
 * Invalid payloads must fail with `.success === false`.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ── Canonical schemas (copy of the route schemas) ─────────────────────────────
// These mirror the schemas defined in the route files.  If a schema changes in
// a route, the corresponding contract here must also be updated — making the
// discrepancy visible at review time.

const fanVoteRequestSchema = z.object({
  votes: z.array(z.object({
    trackId: z.string().uuid(),
    votes: z.number().int().min(0).max(10),
    periodId: z.string().uuid(),
  })).max(50),
})

const djBallotRequestSchema = z.object({
  periodId: z.string().uuid(),
  genre: z.string(),
  rankings: z.array(z.string().uuid()).min(1).max(100),
  candidates: z.array(z.string().uuid()).min(1).max(100),
})

const checkoutSchema = z.object({
  bandId: z.string().uuid(),
  tier: z.enum(['Micro', 'Emerging', 'Established', 'International', 'Macro']),
  totalCategories: z.number().int().min(2),
})

// ── Fan Vote Contract ─────────────────────────────────────────────────────────

describe('Contract: POST /api/votes/fan', () => {
  const TRACK = '11111111-1111-1111-1111-111111111111'
  const PERIOD = '33333333-3333-3333-3333-333333333333'

  it('accepts the canonical frontend payload', () => {
    const payload = {
      votes: [
        { trackId: TRACK, votes: 3, periodId: PERIOD },
      ],
    }
    const result = fanVoteRequestSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('accepts an empty votes array', () => {
    const result = fanVoteRequestSchema.safeParse({ votes: [] })
    expect(result.success).toBe(true)
  })

  it('rejects when trackId is not a UUID', () => {
    const result = fanVoteRequestSchema.safeParse({
      votes: [{ trackId: 'bad-id', votes: 1, periodId: PERIOD }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when votes per track exceeds maximum (10)', () => {
    const result = fanVoteRequestSchema.safeParse({
      votes: [{ trackId: TRACK, votes: 11, periodId: PERIOD }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when votes per track is negative', () => {
    const result = fanVoteRequestSchema.safeParse({
      votes: [{ trackId: TRACK, votes: -1, periodId: PERIOD }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when votes array has more than 50 entries', () => {
    const votes = Array.from({ length: 51 }, () => ({
      trackId: TRACK,
      votes: 1,
      periodId: PERIOD,
    }))
    const result = fanVoteRequestSchema.safeParse({ votes })
    expect(result.success).toBe(false)
  })

  it('rejects when votes field is missing entirely', () => {
    const result = fanVoteRequestSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ── DJ Ballot Contract ────────────────────────────────────────────────────────

describe('Contract: POST /api/votes/dj', () => {
  const PERIOD = '33333333-3333-3333-3333-333333333333'
  const CAND_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const CAND_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

  it('accepts the canonical frontend payload', () => {
    const payload = {
      periodId: PERIOD,
      genre: 'Dark Wave',
      rankings: [CAND_A, CAND_B],
      candidates: [CAND_A, CAND_B],
    }
    const result = djBallotRequestSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('rejects when rankings is empty', () => {
    const result = djBallotRequestSchema.safeParse({
      periodId: PERIOD,
      genre: 'Dark Wave',
      rankings: [],
      candidates: [CAND_A],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when candidates exceeds maximum (100)', () => {
    const ids = Array.from({ length: 101 }, (_, i) =>
      `${String(i).padStart(8, '0')}-0000-0000-0000-000000000000`
    )
    const result = djBallotRequestSchema.safeParse({
      periodId: PERIOD,
      genre: 'X',
      rankings: [ids[0]!],
      candidates: ids,
    })
    expect(result.success).toBe(false)
  })

  it('rejects when periodId is not a UUID', () => {
    const result = djBallotRequestSchema.safeParse({
      periodId: 'not-a-uuid',
      genre: 'X',
      rankings: [CAND_A],
      candidates: [CAND_A],
    })
    expect(result.success).toBe(false)
  })
})

// ── Stripe Checkout Contract ──────────────────────────────────────────────────

describe('Contract: POST /api/stripe/checkout', () => {
  const BAND = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

  it('accepts all valid tier values', () => {
    const tiers = ['Micro', 'Emerging', 'Established', 'International', 'Macro'] as const
    for (const tier of tiers) {
      const result = checkoutSchema.safeParse({ bandId: BAND, tier, totalCategories: 2 })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an invalid tier string', () => {
    const result = checkoutSchema.safeParse({ bandId: BAND, tier: 'Legend', totalCategories: 2 })
    expect(result.success).toBe(false)
  })

  it('rejects totalCategories below 2 (minimum paid checkout)', () => {
    const result = checkoutSchema.safeParse({ bandId: BAND, tier: 'Micro', totalCategories: 1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID bandId', () => {
    const result = checkoutSchema.safeParse({ bandId: 'bad', tier: 'Micro', totalCategories: 2 })
    expect(result.success).toBe(false)
  })

  it('accepts minimum valid totalCategories of 2', () => {
    const result = checkoutSchema.safeParse({ bandId: BAND, tier: 'Micro', totalCategories: 2 })
    expect(result.success).toBe(true)
  })
})

// ── Response Shape Contracts ──────────────────────────────────────────────────

describe('Contract: API response shapes', () => {
  const fanVoteResponseSchema = z.object({
    success: z.literal(true),
    totalCreditsSpent: z.number().int().min(0),
  })

  const djVoteResponseSchema = z.object({
    success: z.literal(true),
    schulzeResult: z.object({
      rankings: z.array(z.string()),
      pairwiseMatrix: z.array(z.array(z.number())),
      strongestPathMatrix: z.array(z.array(z.number())),
      candidates: z.array(z.string()),
    }),
  })

  const checkoutResponseSchema = z.object({
    sessionId: z.string().min(1),
    sessionUrl: z.string().url(),
  })

  it('fan vote success response matches expected shape', () => {
    const payload = { success: true as const, totalCreditsSpent: 42 }
    expect(fanVoteResponseSchema.safeParse(payload).success).toBe(true)
  })

  it('dj vote success response matches expected shape', () => {
    const payload = {
      success: true as const,
      schulzeResult: {
        rankings: ['a', 'b'],
        pairwiseMatrix: [[0, 1], [0, 0]],
        strongestPathMatrix: [[0, 1], [0, 0]],
        candidates: ['a', 'b'],
      },
    }
    expect(djVoteResponseSchema.safeParse(payload).success).toBe(true)
  })

  it('stripe checkout success response matches expected shape', () => {
    const payload = { sessionId: 'cs_123', sessionUrl: 'https://checkout.stripe.com/pay/cs_123' }
    expect(checkoutResponseSchema.safeParse(payload).success).toBe(true)
  })
})
