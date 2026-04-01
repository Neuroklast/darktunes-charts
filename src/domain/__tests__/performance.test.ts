/**
 * Performance tests for Schulze O(n³) algorithm.
 *
 * These tests verify that the algorithm completes within acceptable time bounds
 * for the largest realistic inputs in a single voting cycle:
 *   – Schulze: up to 100 nominees (maximum per API contract)
 *
 * Thresholds are generous enough to be stable on CI but tight enough to catch
 * catastrophic regressions (e.g. an accidental O(n⁴) loop).
 */

import { describe, it, expect } from 'vitest'
import { calculateSchulzeMethod, type BallotRanking } from '@/domain/voting/schulze'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generates `count` deterministic UUID-like strings. */
function makeIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    `${String(i).padStart(8, '0')}-0000-0000-0000-000000000000`
  )
}

/**
 * Generates `ballotCount` synthetic DJ ballots over `candidates`.
 * Each ballot is a random permutation of the candidates list.
 */
function makeBallots(candidates: string[], ballotCount: number): BallotRanking[] {
  return Array.from({ length: ballotCount }, (_, bi) => {
    // Deterministic Fisher-Yates using a simple linear-congruential PRNG
    const shuffled = [...candidates]
    let seed = bi + 1
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff
      const j = Math.abs(seed) % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    return { djId: `dj-${bi}`, rankings: shuffled }
  })
}

// ── Schulze Performance Tests ─────────────────────────────────────────────────

describe('Schulze O(n³) performance', () => {
  it('completes for n=10 candidates in < 50 ms', () => {
    const candidates = makeIds(10)
    const ballots = makeBallots(candidates, 20)

    const start = performance.now()
    const result = calculateSchulzeMethod(candidates, ballots)
    const elapsed = performance.now() - start

    expect(result.rankings).toHaveLength(10)
    expect(elapsed).toBeLessThan(50)
  })

  it('completes for n=50 candidates (25 ballots) in < 200 ms', () => {
    const candidates = makeIds(50)
    const ballots = makeBallots(candidates, 25)

    const start = performance.now()
    const result = calculateSchulzeMethod(candidates, ballots)
    const elapsed = performance.now() - start

    expect(result.rankings).toHaveLength(50)
    expect(elapsed).toBeLessThan(200)
  })

  it('completes for n=100 candidates (50 ballots) in < 500 ms', () => {
    // n=100 is the API contract maximum (djBallotRequestSchema max 100)
    const candidates = makeIds(100)
    const ballots = makeBallots(candidates, 50)

    const start = performance.now()
    const result = calculateSchulzeMethod(candidates, ballots)
    const elapsed = performance.now() - start

    expect(result.rankings).toHaveLength(100)
    // Verify matrix dimensions (n×n)
    expect(result.pairwiseMatrix).toHaveLength(100)
    expect(result.pairwiseMatrix[0]).toHaveLength(100)
    expect(elapsed).toBeLessThan(500)
  })

  it('produces a valid total ordering (all candidates ranked exactly once)', () => {
    const candidates = makeIds(20)
    const ballots = makeBallots(candidates, 30)
    const result = calculateSchulzeMethod(candidates, ballots)

    const ranked = new Set(result.rankings)
    expect(ranked.size).toBe(candidates.length)
    for (const id of candidates) {
      expect(ranked.has(id)).toBe(true)
    }
  })

  it('returns the only candidate immediately for n=1', () => {
    const candidates = makeIds(1)
    const result = calculateSchulzeMethod(candidates, [])
    expect(result.rankings).toEqual(candidates)
  })

  it('handles empty ballots without throwing (no ballots = all pairwise ties)', () => {
    const candidates = makeIds(5)
    const result = calculateSchulzeMethod(candidates, [])
    expect(result.rankings).toHaveLength(5)
  })
})
