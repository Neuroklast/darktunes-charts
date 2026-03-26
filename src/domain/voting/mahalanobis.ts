/**
 * Mahalanobis distance–based outlier detection for peer voting.
 *
 * The Mahalanobis distance generalises the z-score to multivariate data by
 * accounting for correlations between dimensions (here: which bands each voter
 * chose, encoded as a binary vector over all possible bands).
 *
 * Votes whose Mahalanobis distance from the centroid of all vote vectors
 * exceeds a configurable threshold are considered statistical outliers and
 * receive a down-weighted contribution.
 *
 * Why not simple Euclidean distance?  Euclidean distance treats all dimensions
 * as independent and equally scaled.  Mahalanobis distance uses the inverse of
 * the covariance matrix, so if many voters tend to vote for the same pair of
 * bands together, a voter who only votes for one of them is penalised more.
 *
 * Time complexity: O(n²k + k³) where n = number of voters, k = number of bands.
 * This is pre-computed asynchronously; not called in the hot path.
 */

/** A single voter's voting pattern encoded as a band-ID → vote-weight map. */
export interface VotingVector {
  voterId: string
  /** bandId → raw vote weight (0 if the voter did not vote for that band). */
  votes: Map<string, number>
}

/** Result of the outlier detection pass for a single voter. */
export interface OutlierResult {
  voterId: string
  mahalanobisDistance: number
  isOutlier: boolean
  /** Weight multiplier to apply: 1.0 for normal voters, < 1.0 for outliers. */
  weightMultiplier: number
}

/** Configuration for the outlier detection threshold. */
export const MAHALANOBIS_THRESHOLD = 3.0
export const OUTLIER_WEIGHT_FLOOR = 0.3

/** Minimum absolute pivot value below which a matrix is considered singular. */
const SINGULARITY_EPSILON = 1e-12


 *
 * @param vectors - One entry per voter.
 * @param allBandIds - Ordered list of all band IDs (defines column indices).
 * @returns 2D array [voters × bands].
 */
export function encodeVotingMatrix(
  vectors: VotingVector[],
  allBandIds: string[]
): number[][] {
  return vectors.map(v =>
    allBandIds.map(bandId => v.votes.get(bandId) ?? 0)
  )
}

/**
 * Computes the column means (centroid) of a numeric matrix.
 *
 * @param matrix - 2D array [n × k].
 * @returns Array of k means.
 */
export function computeMeans(matrix: number[][]): number[] {
  if (matrix.length === 0) return []
  const n = matrix.length
  const k = matrix[0]!.length
  const inverseN = 1 / n
  const means = new Array<number>(k).fill(0)

  for (const row of matrix) {
    for (let j = 0; j < k; j++) {
      means[j]! += row[j]! * inverseN
    }
  }

  return means
}

/**
 * Computes the covariance matrix of a numeric data matrix.
 *
 * Uses the unbiased estimator (divided by n-1).
 * Returns a k×k identity matrix if n < 2 to avoid division by zero.
 *
 * @param matrix - 2D array [n × k] (mean-centred).
 * @returns k×k covariance matrix.
 */
export function computeCovarianceMatrix(matrix: number[][]): number[][] {
  const n = matrix.length
  const k = matrix[0]?.length ?? 0

  if (n < 2) {
    // Return identity matrix — every direction is equally uncertain.
    return Array.from({ length: k }, (_, i) =>
      Array.from({ length: k }, (__, j) => (i === j ? 1 : 0))
    )
  }

  const cov: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  const inverseNm1 = 1 / (n - 1)

  for (const row of matrix) {
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        cov[i]![j]! += row[i]! * row[j]! * inverseNm1
      }
    }
  }

  return cov
}

/**
 * Inverts a square matrix using Gaussian elimination with partial pivoting.
 *
 * Returns the identity matrix if the input is singular (determinant ≈ 0),
 * which gracefully degrades to Euclidean distance behaviour.
 *
 * @param matrix - k×k invertible matrix.
 * @returns k×k inverse matrix.
 */
export function invertMatrix(matrix: number[][]): number[][] {
  const k = matrix.length
  // Augment with identity matrix.
  const aug = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0)),
  ])

  for (let col = 0; col < k; col++) {
    // Find pivot row.
    let maxRow = col
    for (let row = col + 1; row < k; row++) {
      if (Math.abs(aug[row]![col]!) > Math.abs(aug[maxRow]![col]!)) {
        maxRow = row
      }
    }

    ;[aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!]

    const pivot = aug[col]![col]!
    if (Math.abs(pivot) < SINGULARITY_EPSILON) {
      // Singular matrix — return identity.
      return Array.from({ length: k }, (_, i) =>
        Array.from({ length: k }, (__, j) => (i === j ? 1 : 0))
      )
    }

    for (let j = 0; j < 2 * k; j++) {
      aug[col]![j]! /= pivot
    }

    for (let row = 0; row < k; row++) {
      if (row === col) continue
      const factor = aug[row]![col]!
      for (let j = 0; j < 2 * k; j++) {
        aug[row]![j]! -= factor * aug[col]![j]!
      }
    }
  }

  return aug.map(row => row.slice(k))
}

/**
 * Computes the Mahalanobis distance between a vector and the distribution centroid.
 *
 * D_M(x) = sqrt((x - μ)ᵀ Σ⁻¹ (x - μ))
 *
 * @param x - Data point (k-dimensional).
 * @param mean - Distribution centroid (k-dimensional).
 * @param invCov - Inverse covariance matrix (k×k).
 * @returns Scalar Mahalanobis distance ≥ 0.
 */
export function mahalanobisDistance(
  x: number[],
  mean: number[],
  invCov: number[][]
): number {
  const k = x.length
  const diff = x.map((xi, i) => xi - mean[i]!)

  // temp = invCov × diff
  const temp = new Array<number>(k).fill(0)
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      temp[i]! += invCov[i]![j]! * diff[j]!
    }
  }

  // distance² = diffᵀ × temp
  let distSq = 0
  for (let i = 0; i < k; i++) {
    distSq += diff[i]! * temp[i]!
  }

  return Math.sqrt(Math.max(0, distSq))
}

/**
 * Detects statistical outliers in a set of peer voting vectors.
 *
 * Voters whose Mahalanobis distance exceeds MAHALANOBIS_THRESHOLD standard
 * deviations from the centroid receive a reduced weight multiplier that scales
 * linearly from 1.0 at the threshold down to OUTLIER_WEIGHT_FLOOR.
 *
 * @param vectors - One VotingVector per participating voter.
 * @returns Array of outlier detection results, one per voter.
 */
export function detectOutliers(vectors: VotingVector[]): OutlierResult[] {
  if (vectors.length === 0) return []

  const allBandIds = Array.from(
    new Set(vectors.flatMap(v => Array.from(v.votes.keys())))
  ).sort()

  if (allBandIds.length === 0) {
    return vectors.map(v => ({
      voterId: v.voterId,
      mahalanobisDistance: 0,
      isOutlier: false,
      weightMultiplier: 1.0,
    }))
  }

  const rawMatrix = encodeVotingMatrix(vectors, allBandIds)
  const means = computeMeans(rawMatrix)

  // Mean-centre the matrix.
  const centredMatrix = rawMatrix.map(row =>
    row.map((val, j) => val - means[j]!)
  )

  const cov = computeCovarianceMatrix(centredMatrix)
  const invCov = invertMatrix(cov)

  return vectors.map((v, i) => {
    const row = rawMatrix[i]!
    const distance = mahalanobisDistance(row, means, invCov)
    const isOutlier = distance > MAHALANOBIS_THRESHOLD

    let weightMultiplier = 1.0
    if (isOutlier) {
      // Linear decay: 1.0 at threshold → OUTLIER_WEIGHT_FLOOR as distance → ∞.
      const excess = distance - MAHALANOBIS_THRESHOLD
      const decayRate = 0.1
      weightMultiplier = Math.max(
        OUTLIER_WEIGHT_FLOOR,
        1.0 - excess * decayRate
      )
    }

    return {
      voterId: v.voterId,
      mahalanobisDistance: distance,
      isOutlier,
      weightMultiplier,
    }
  })
}
