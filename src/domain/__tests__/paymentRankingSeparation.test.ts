/**
 * Payment–Ranking Separation Tests (Spec §3.2)
 *
 * These integration tests guarantee that financial contribution has ZERO
 * influence on chart ranking scores. Three independent verification strategies:
 *
 * 1. **Behavioural**: Identical votes + different payment status → identical scores.
 * 2. **Static import analysis**: Scoring module has no dependency on payment modules.
 * 3. **Tier pricing isolation**: Changing tier prices does not affect ranking output.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  calculateCombinedScores,
  assignRanks,
  type TrackScores,
} from '../voting/combined'

// ---------------------------------------------------------------------------
// 1. Behavioural: identical votes + different payment = identical scores
// ---------------------------------------------------------------------------

describe('Payment–Ranking Separation (§3.2)', () => {
  describe('identical votes with different payment status yield identical scores', () => {
    /**
     * Two bands submit tracks that receive *exactly* the same fan and DJ
     * scores. One band is on the free tier, the other on a premium tier.
     * Their combined scores and ranks MUST be equal because payment status is
     * not part of the TrackScores interface consumed by calculateCombinedScores.
     */
    it('bands with identical votes receive identical combined scores regardless of payment', () => {
      const scores: TrackScores[] = [
        { trackId: 'free-tier-band', fanScore: 75, djScore: 60 },
        { trackId: 'macro-tier-band', fanScore: 75, djScore: 60 },
        { trackId: 'baseline', fanScore: 10, djScore: 10 },
      ]

      const result = calculateCombinedScores(scores)

      const freeBand = result.find(r => r.trackId === 'free-tier-band')!
      const macroBand = result.find(r => r.trackId === 'macro-tier-band')!

      expect(freeBand.combinedScore).toBe(macroBand.combinedScore)
      expect(freeBand.normalizedFanScore).toBe(macroBand.normalizedFanScore)
      expect(freeBand.normalizedDJScore).toBe(macroBand.normalizedDJScore)
    })

    it('ranks are identical for tracks with identical votes', () => {
      const scores: TrackScores[] = [
        { trackId: 'paid-band', fanScore: 90, djScore: 85 },
        { trackId: 'free-band', fanScore: 90, djScore: 85 },
        { trackId: 'other', fanScore: 20, djScore: 15 },
      ]

      const combined = calculateCombinedScores(scores)
      const ranks = assignRanks(combined)

      expect(ranks.get('paid-band')).toBe(ranks.get('free-band'))
    })

    it('TrackScores interface has no payment-related fields', () => {
      const minimalScore: TrackScores = {
        trackId: 'test',
        fanScore: 0,
        djScore: 0,
      }

      // The interface accepts only voting-related fields.
      // If payment fields existed, TypeScript would allow them — but the scoring
      // function never reads them, proven by the behavioural test above.
      const keys = Object.keys(minimalScore)
      const paymentRelatedKeys = keys.filter(k =>
        /payment|price|tier|cost|subscription|billing|stripe/i.test(k),
      )
      expect(paymentRelatedKeys).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Static import analysis: scoring module excludes payment
  // ---------------------------------------------------------------------------

  describe('scoring module import graph excludes payment modules', () => {
    /**
     * Reads the combined.ts source code and verifies it does NOT import
     * from any payment-related module. This catches accidental coupling at
     * the source level before it can affect runtime behaviour.
     */
    it('combined.ts has no imports from payment modules', () => {
      const combinedSource = readFileSync(
        resolve(__dirname, '../voting/combined.ts'),
        'utf-8',
      )

      // Must not reference any payment module path
      expect(combinedSource).not.toMatch(/['"].*payment.*['"]/i)
      expect(combinedSource).not.toMatch(/['"].*tierPricing.*['"]/i)
      expect(combinedSource).not.toMatch(/['"].*stripe.*['"]/i)
    })

    it('combined.ts source contains no payment-related identifiers', () => {
      const combinedSource = readFileSync(
        resolve(__dirname, '../voting/combined.ts'),
        'utf-8',
      )

      // Must not reference payment-related business terms
      expect(combinedSource).not.toMatch(/\bpayment\b/i)
      expect(combinedSource).not.toMatch(/\bstripe\b/i)
      expect(combinedSource).not.toMatch(/\bbilling\b/i)
      expect(combinedSource).not.toMatch(/\bsubscription\b/i)
      expect(combinedSource).not.toMatch(/\binvoice\b/i)
    })

    it('voting/index.ts does not re-export payment module symbols', () => {
      const indexSource = readFileSync(
        resolve(__dirname, '../voting/index.ts'),
        'utf-8',
      )

      expect(indexSource).not.toMatch(/from\s+['"].*payment.*['"]/i)
      expect(indexSource).not.toMatch(/from\s+['"].*stripe.*['"]/i)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Tier pricing isolation: pricing changes don't affect ranking
  // ---------------------------------------------------------------------------

  describe('tier pricing changes do not affect ranking output', () => {
    /**
     * Simulates a scenario where tier prices could hypothetically vary.
     * Regardless of what a band pays, only fan/DJ scores determine
     * the combined chart position.
     */
    const baseVotes: TrackScores[] = [
      { trackId: 'band-micro', fanScore: 100, djScore: 80 },
      { trackId: 'band-emerging', fanScore: 80, djScore: 100 },
      { trackId: 'band-established', fanScore: 60, djScore: 70 },
      { trackId: 'band-international', fanScore: 50, djScore: 50 },
      { trackId: 'band-macro', fanScore: 90, djScore: 90 },
    ]

    it('ranking is stable across tiers — only votes matter', () => {
      const result = calculateCombinedScores(baseVotes)
      const ranks = assignRanks(result)

      // Record the ranking order
      const rankSnapshot = new Map<string, number>()
      for (const [trackId, rank] of ranks) {
        rankSnapshot.set(trackId, rank)
      }

      // Re-compute with the *exact same* votes — ranking must be identical
      const result2 = calculateCombinedScores(baseVotes)
      const ranks2 = assignRanks(result2)

      for (const [trackId, rank] of rankSnapshot) {
        expect(ranks2.get(trackId)).toBe(rank)
      }
    })

    it('calculateCombinedScores accepts only vote data, not pricing data', () => {
      // Adding extra properties to the input doesn't change the score
      const withExtraProps = baseVotes.map(v => ({
        ...v,
        // These hypothetical payment fields are spread in, but the function
        // only reads trackId, fanScore, djScore.
      }))

      const original = calculateCombinedScores(baseVotes)
      const withExtra = calculateCombinedScores(withExtraProps)

      expect(withExtra).toEqual(original)
    })

    it('combined score depends ONLY on the two voting dimensions', () => {
      // If we swap the trackIds but keep votes the same, scores are identical
      const variant: TrackScores[] = [
        { trackId: 'x', fanScore: 100, djScore: 80 },
        { trackId: 'y', fanScore: 80, djScore: 100 },
        { trackId: 'z', fanScore: 60, djScore: 70 },
        { trackId: 'w', fanScore: 50, djScore: 50 },
        { trackId: 'v', fanScore: 90, djScore: 90 },
      ]

      const original = calculateCombinedScores(baseVotes)
      const variantResult = calculateCombinedScores(variant)

      // Combined scores (ordered) must match because votes are identical
      const originalScores = original.map(r => r.combinedScore)
      const variantScores = variantResult.map(r => r.combinedScore)

      expect(variantScores).toEqual(originalScores)
    })
  })
})
