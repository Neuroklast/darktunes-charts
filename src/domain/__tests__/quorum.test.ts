import { describe, it, expect } from 'vitest'
import {
  evaluateQuorum,
  DJ_QUORUM,
  type QuorumStatus,
} from '../voting/quorum'
import type { PillarWeights } from '../voting/combined'

/** Sums pillar weights and checks they total 1.0 (within floating-point tolerance). */
function weightsSum(w: PillarWeights): number {
  return w.fan + w.dj
}

describe('evaluateQuorum', () => {
  const equalWeights: PillarWeights = { fan: 0.5, dj: 0.5 }
  const coverArtWeights: PillarWeights = { fan: 0.80, dj: 0.20 }
  const trackWeights: PillarWeights = { fan: 0.55, dj: 0.45 }

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

  it('redistributes DJ weight entirely to fan at "partial" level with trackWeights', () => {
    // trackWeights: fan=0.55, dj=0.45
    // partial: dj *= 0.5 → effectiveDJ=0.225, displaced=0.225
    // all displaced goes to fan → adjustedFan = 0.55 + 0.225 = 0.775
    const result = evaluateQuorum(7, trackWeights)
    expect(result.adjustedWeights.dj).toBeCloseTo(0.225)
    expect(result.adjustedWeights.fan).toBeCloseTo(0.775)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
  })

  it('redistributes DJ weight entirely to fan at "insufficient" level with cover-art weights (80/20)', () => {
    // coverArtWeights: fan=0.80, dj=0.20
    // insufficient: effectiveDJ=0, displaced=0.20
    // all displaced goes to fan → adjustedFan = 0.80 + 0.20 = 1.0
    const result = evaluateQuorum(0, coverArtWeights)
    expect(result.adjustedWeights.dj).toBeCloseTo(0)
    expect(result.adjustedWeights.fan).toBeCloseTo(1.0)
    expect(weightsSum(result.adjustedWeights)).toBeCloseTo(1.0)
  })

  it('fan gets all weight when DJ is zeroed at insufficient quorum', () => {
    const result = evaluateQuorum(0, equalWeights)
    // equal weights: fan=0.5, dj=0.5
    // After DJ=0: displaced = 0.5 → all to fan → fan = 1.0
    expect(result.adjustedWeights.fan).toBeCloseTo(1.0)
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
