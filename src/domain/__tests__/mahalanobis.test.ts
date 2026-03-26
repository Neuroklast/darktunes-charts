import { describe, it, expect } from 'vitest'
import {
  encodeVotingMatrix,
  computeMeans,
  computeCovarianceMatrix,
  invertMatrix,
  mahalanobisDistance,
  detectOutliers,
  type VotingVector,
  MAHALANOBIS_THRESHOLD,
  OUTLIER_WEIGHT_FLOOR,
} from '../voting/mahalanobis'

describe('encodeVotingMatrix', () => {
  it('encodes voting vectors into a numeric matrix', () => {
    const vectors: VotingVector[] = [
      { voterId: 'v1', votes: new Map([['b1', 1.0], ['b2', 0.5]]) },
      { voterId: 'v2', votes: new Map([['b1', 0.8]]) },
    ]
    const allBandIds = ['b1', 'b2']
    const matrix = encodeVotingMatrix(vectors, allBandIds)
    expect(matrix).toHaveLength(2)
    expect(matrix[0]).toEqual([1.0, 0.5])
    expect(matrix[1]).toEqual([0.8, 0])
  })

  it('returns empty matrix for empty vectors', () => {
    expect(encodeVotingMatrix([], [])).toEqual([])
  })
})

describe('computeMeans', () => {
  it('computes column means', () => {
    const matrix = [[1, 2], [3, 4], [5, 6]]
    const means = computeMeans(matrix)
    expect(means[0]).toBeCloseTo(3)
    expect(means[1]).toBeCloseTo(4)
  })

  it('returns empty for empty matrix', () => {
    expect(computeMeans([])).toEqual([])
  })
})

describe('computeCovarianceMatrix', () => {
  it('returns identity for n < 2', () => {
    const matrix = [[1, 0], [0, 1]]
    const single = [matrix[0]!]
    const cov = computeCovarianceMatrix(single)
    expect(cov[0]![0]).toBe(1)
    expect(cov[0]![1]).toBe(0)
    expect(cov[1]![0]).toBe(0)
    expect(cov[1]![1]).toBe(1)
  })

  it('returns symmetric matrix', () => {
    const matrix = [[1, 2], [3, 4], [5, 6]]
    const cov = computeCovarianceMatrix(matrix)
    expect(cov[0]![1]).toBeCloseTo(cov[1]![0]!)
  })
})

describe('invertMatrix', () => {
  it('returns identity for identity matrix', () => {
    const identity = [[1, 0], [0, 1]]
    const inv = invertMatrix(identity)
    expect(inv[0]![0]).toBeCloseTo(1)
    expect(inv[0]![1]).toBeCloseTo(0)
    expect(inv[1]![0]).toBeCloseTo(0)
    expect(inv[1]![1]).toBeCloseTo(1)
  })

  it('correctly inverts a simple 2×2 matrix', () => {
    // [[2, 0], [0, 4]] → [[0.5, 0], [0, 0.25]]
    const matrix = [[2, 0], [0, 4]]
    const inv = invertMatrix(matrix)
    expect(inv[0]![0]).toBeCloseTo(0.5)
    expect(inv[1]![1]).toBeCloseTo(0.25)
  })

  it('returns identity for singular matrix', () => {
    const singular = [[1, 2], [2, 4]]
    const inv = invertMatrix(singular)
    expect(inv[0]![0]).toBeCloseTo(1)
    expect(inv[1]![1]).toBeCloseTo(1)
  })
})

describe('mahalanobisDistance', () => {
  it('returns 0 for a point at the centroid', () => {
    const mean = [1, 2]
    const invCov = [[1, 0], [0, 1]]
    const distance = mahalanobisDistance([1, 2], mean, invCov)
    expect(distance).toBeCloseTo(0)
  })

  it('returns positive distance for off-centroid point', () => {
    const mean = [0, 0]
    const invCov = [[1, 0], [0, 1]]
    const distance = mahalanobisDistance([3, 4], mean, invCov)
    expect(distance).toBeCloseTo(5) // Euclidean in this case (identity invCov)
  })
})

describe('detectOutliers', () => {
  it('returns empty for empty input', () => {
    expect(detectOutliers([])).toEqual([])
  })

  it('does not flag normal voters', () => {
    // Create voters with similar patterns
    const vectors: VotingVector[] = [
      { voterId: 'v1', votes: new Map([['b1', 1.0], ['b2', 0.8]]) },
      { voterId: 'v2', votes: new Map([['b1', 0.9], ['b2', 0.7]]) },
      { voterId: 'v3', votes: new Map([['b1', 0.95], ['b2', 0.85]]) },
    ]
    const results = detectOutliers(vectors)
    expect(results).toHaveLength(3)
    // All should have weight multipliers
    for (const r of results) {
      expect(r.weightMultiplier).toBeGreaterThan(0)
      expect(r.weightMultiplier).toBeLessThanOrEqual(1)
    }
  })

  it('returns correct structure', () => {
    const vectors: VotingVector[] = [
      { voterId: 'v1', votes: new Map([['b1', 1.0]]) },
    ]
    const results = detectOutliers(vectors)
    expect(results[0]).toHaveProperty('voterId', 'v1')
    expect(results[0]).toHaveProperty('mahalanobisDistance')
    expect(results[0]).toHaveProperty('isOutlier')
    expect(results[0]).toHaveProperty('weightMultiplier')
  })

  it('outlier weight multiplier is at least OUTLIER_WEIGHT_FLOOR', () => {
    const vectors: VotingVector[] = [
      { voterId: 'outlier', votes: new Map([['b1', 1.0]]) },
    ]
    const results = detectOutliers(vectors)
    expect(results[0]!.weightMultiplier).toBeGreaterThanOrEqual(OUTLIER_WEIGHT_FLOOR)
  })

  it('exports MAHALANOBIS_THRESHOLD and OUTLIER_WEIGHT_FLOOR constants', () => {
    expect(MAHALANOBIS_THRESHOLD).toBeGreaterThan(0)
    expect(OUTLIER_WEIGHT_FLOOR).toBeGreaterThan(0)
    expect(OUTLIER_WEIGHT_FLOOR).toBeLessThan(1)
  })
})
