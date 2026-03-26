import { describe, it, expect } from 'vitest'
import {
  countTrianglesForVoter,
  computeTriadicPenalty,
  applyTriadicCensusPenalty,
} from '../voting/triadicCensus'
import type { BandVote } from '@/lib/types'

// Build adjacency from the raw map for test convenience
function makeAdj(map: Map<string, string[]>): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  for (const [k, v] of map) adj.set(k, new Set(v))
  return adj
}

describe('countTrianglesForVoter', () => {
  it('returns 0 when there are no triangles', () => {
    const map = new Map([
      ['A', ['B']],
      ['B', ['C']],
    ])
    expect(countTrianglesForVoter('A', makeAdj(map))).toBe(0)
  })

  it('detects a single closed triangle A→B→C→A', () => {
    const map = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ])
    expect(countTrianglesForVoter('A', makeAdj(map))).toBe(1)
  })

  it('returns 0 for voter not in adjacency map', () => {
    const map = new Map([['X', ['Y']]])
    expect(countTrianglesForVoter('Z', makeAdj(map))).toBe(0)
  })

  it('counts multiple triangles for the same voter', () => {
    // A→B→C→A and A→D→E→A
    const map = new Map([
      ['A', ['B', 'D']],
      ['B', ['C']],
      ['C', ['A']],
      ['D', ['E']],
      ['E', ['A']],
    ])
    expect(countTrianglesForVoter('A', makeAdj(map))).toBe(2)
  })
})

describe('computeTriadicPenalty', () => {
  it('returns 1.0 for voters with no triangles', () => {
    const map = new Map([['A', ['B']], ['B', ['C']]])
    expect(computeTriadicPenalty('A', makeAdj(map))).toBe(1.0)
  })

  it('applies 0.7 penalty for one triangle', () => {
    const map = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ])
    expect(computeTriadicPenalty('A', makeAdj(map))).toBeCloseTo(0.7)
  })

  it('clamps to MIN_WEIGHT 0.4 for many triangles', () => {
    // Three triangles: 0.7^3 ≈ 0.343 → clamped to 0.4
    const map = new Map([
      ['A', ['B', 'D', 'F']],
      ['B', ['C']],
      ['C', ['A']],
      ['D', ['E']],
      ['E', ['A']],
      ['F', ['G']],
      ['G', ['A']],
    ])
    expect(computeTriadicPenalty('A', makeAdj(map))).toBe(0.4)
  })
})

describe('applyTriadicCensusPenalty', () => {
  it('does not mutate original votes', () => {
    const map = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ])
    const votes: BandVote[] = [
      { voterId: 'A', votedBandId: 'B', weight: 1.0 },
    ]
    const original = JSON.stringify(votes)
    applyTriadicCensusPenalty(votes, map)
    expect(JSON.stringify(votes)).toBe(original)
  })

  it('applies penalty to triangle participant', () => {
    const map = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ])
    const votes: BandVote[] = [
      { voterId: 'A', votedBandId: 'B', weight: 1.0 },
    ]
    const result = applyTriadicCensusPenalty(votes, map)
    expect(result[0]!.weight).toBeCloseTo(0.7)
  })

  it('does not penalise voters outside any triangle', () => {
    const map = new Map([['A', ['B']], ['B', ['C']]])
    const votes: BandVote[] = [
      { voterId: 'A', votedBandId: 'B', weight: 0.8 },
    ]
    const result = applyTriadicCensusPenalty(votes, map)
    expect(result[0]!.weight).toBeCloseTo(0.8)
  })

  it('memoises penalty computation per voter', () => {
    const map = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ])
    const votes: BandVote[] = [
      { voterId: 'A', votedBandId: 'B', weight: 1.0 },
      { voterId: 'A', votedBandId: 'C', weight: 1.0 },
    ]
    const result = applyTriadicCensusPenalty(votes, map)
    // Both votes from A should carry the same penalty
    expect(result[0]!.weight).toBeCloseTo(result[1]!.weight)
  })
})
