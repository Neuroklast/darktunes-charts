import { describe, it, expect } from 'vitest'
import {
  evaluateQuorum,
  DJ_QUORUM,
  type QuorumStatus,
} from '../voting/quorum'
import type { PillarWeights } from '../voting/combined'

/** Sums pillar weights and checks they total 1.0 (within floating-point tolerance). */
function weightsSum(w: PillarWeights): number {
  return w.fan + w.dj + w.peer
}

describe('evaluateQuorum', () => {
  const equalWeights: PillarWeights = { fan: 1 / 3, dj: 1 / 3, peer: 1 / 3 }
  const coverArtWeights: PillarWeights = { fan: 0.7, dj: 0.15, peer: 0.15 }
  const trackWeights: PillarWeights = { fan: 0.4, dj: 0.3, peer: 0.3 }

  // --- Quorum levels ---

  it('returns "full" level at exactly 10 ballots', () => {
    const result = evaluateQuorum(10, equalWeights)
    expect(result.level).toBe('full')
    expect(result.effectiveDJWeightMultiplier).toBe(1.0)
  })

  it('returns "full" level for more than 10 ballots', () => {
    const result = evaluateQuorum(25, equalWeights)
    expect(result.level).toBe('full')
  })

  it('returns "partial" level at exactly 5 ballots', () => {
    const result = evaluateQuorum(5, equalWeights)
    expect(result.level).toBe('partial')
    expect(result.effectiveDJWeightMultiplier).toBe(0.5)
  })

  it('returns "partial" level for 6–9 ballots', () => {
    for (const count of [6, 7, 8, 9]) {
      const result = evaluateQuorum(count, equalWeights)
      expect(result.level).toBe('partial')
    }
  })

  it('returns "minimum" level at exactly 3 ballots', () => {
    const result = evaluateQuorum(3, equalWeights)
    expect(result.level).toBe('minimum')
    expect(result.effectiveDJWeightMultiplier).toBe(0.25)
  })

  it('returns "minimum" level for 4 ballots', () => {
    const result = evaluateQuorum(4, equalWeights)
    expect(result.level).toBe('minimum')
  })

  it('returns "insufficient" for 2 ballots', () => {
    const result = evaluateQuorum(2, equalWeights)
    expect(result.level).toBe('insufficient')
    expect(result.effectiveDJWeightMultiplier).toBe(0.0)
  })

  it('returns "insufficient" for 1 ballot', () => {
    expect(evaluateQuorum(1, equalWeights).level).toBe('insufficient')
  })

  it('returns "insufficient" for 0 ballots', () => {
    expect(evaluateQuorum(0, equalWeights).level).toBe('insufficient')
  })

  it('clamps negative ballot counts to 0 (edge case)', () => {
    const result = evaluateQuorum(-5, equalWeights)
    expect(result.level).toBe('insufficient')
    expect(result.ballotCount).toBe(0)
  })

  // --- Weight redistribution sums to 1.0 ---

  it('weights always sum to 1.0 at "full" level', () => {
    const result = evaluateQuorum(15, equalWeights)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
  })

  it('weights always sum to 1.0 at "partial" level', () => {
    const result = evaluateQuorum(7, equalWeights)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
  })

  it('weights always sum to 1.0 at "minimum" level', () => {
    const result = evaluateQuorum(3, equalWeights)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
  })

  it('weights always sum to 1.0 at "insufficient" level', () => {
    const result = evaluateQuorum(0, equalWeights)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
  })

  it('DJ weight is 0 at "insufficient" level', () => {
    const result = evaluateQuorum(1, equalWeights)
    expect(result.adjustedWeights.dj).toBe(0)
  })

  // --- Correct redistribution with various base weights ---

  it('redistributes DJ weight to fan+peer in original ratio at "partial" level with trackWeights', () => {
    // trackWeights: fan=0.4, dj=0.3, peer=0.3
    // partial: dj *= 0.5 → effectiveDJ=0.15, displaced=0.15
    // fan ratio = 0.4/0.6 = 2/3, peer ratio = 0.3/0.6 = 1/2 → wait: (0.4+0.3)=0.7, no fan+peer=0.4+0.3=0.7
    // fan share = 0.4/0.7, peer share = 0.3/0.7
    const result = evaluateQuorum(7, trackWeights)
    expect(result.adjustedWeights.dj).toBeCloseTo(0.15)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
    // Fan should receive more than peer (fan 0.4 > peer 0.3 in original)
    expect(result.adjustedWeights.fan).toBeGreaterThan(result.adjustedWeights.peer)
  })

  it('redistributes DJ weight correctly at "insufficient" level with cover-art weights (70/15/15)', () => {
    // coverArtWeights: fan=0.7, dj=0.15, peer=0.15
    // insufficient: effectiveDJ=0, displaced=0.15
    // fan ratio = 0.7/0.85, peer ratio = 0.15/0.85
    const result = evaluateQuorum(0, coverArtWeights)
    expect(result.adjustedWeights.dj).toBeCloseTo(0)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
    // Fan should dominate after redistribution
    expect(result.adjustedWeights.fan).toBeGreaterThan(0.8)
  })

  it('produces valid proportional fan/peer split when DJ weight is 0 at insufficient quorum', () => {
    const result = evaluateQuorum(0, equalWeights)
    // equal weights: fan and peer each started at 1/3, DJ at 1/3
    // After DJ=0: displaced = 1/3. fan share = (1/3)/(2/3) = 0.5, peer share = 0.5
    expect(result.adjustedWeights.fan).toBeCloseTo(result.adjustedWeights.peer, 5)
    expect(result.adjustedWeights.dj).toBe(0)
  })

  // --- Warning messages ---

  it('has no warning at "full" level', () => {
    const result = evaluateQuorum(12, equalWeights)
    expect(result.warning).toBeUndefined()
  })

  it('includes a warning at "partial" level', () => {
    const result = evaluateQuorum(6, equalWeights)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('partial')
  })

  it('includes a warning at "minimum" level', () => {
    const result = evaluateQuorum(4, equalWeights)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('25 %')
  })

  it('includes a warning at "insufficient" level', () => {
    const result = evaluateQuorum(2, equalWeights)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('excluded')
  })

  it('reports the actual ballot count in the status', () => {
    const result = evaluateQuorum(7, equalWeights)
    expect(result.ballotCount).toBe(7)
  })

  // --- DJ_QUORUM constant sanity check ---

  it('DJ_QUORUM constants are correctly ordered (minimum < partial < full)', () => {
    expect(DJ_QUORUM.minimum).toBeLessThan(DJ_QUORUM.partial)
    expect(DJ_QUORUM.partial).toBeLessThan(DJ_QUORUM.full)
  })
})
