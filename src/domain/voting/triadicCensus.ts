/**
 * Triadic Census — closed-triangle detection in the peer-voting graph.
 *
 * A "triadic census" counts how many closed triangles exist in a directed
 * graph.  In the context of peer voting: A→B, B→C, and C→A form a closed
 * triangle.  Such rings indicate coordinated mutual promotion rather than
 * genuine appreciation.
 *
 * The algorithm assigns a graduated penalty to every vote that is part of at
 * least one closed triangle:
 *   weight *= TRIANGLE_PENALTY  (default 0.7) per triangle membership
 *   minimum weight is clamped at MIN_WEIGHT (0.4) to prevent full discard.
 *
 * Complexity: O(|V| × |E|) — for each voter A, we check A's direct targets B,
 * and for each B we check whether any of B's targets C also votes back for A.
 * In practice the voting graph is sparse so this is fast.
 *
 * Research basis: Triadic Census is a standard Social Network Analysis (SNA)
 * metric introduced by Holland & Leinhardt (1970).  Applied here to detect
 * coordinated voting rings in the spirit of the Eurovision analysis by
 * Gatherer (2006).
 */

import type { BandVote } from '@/lib/types'

/** Penalty multiplier applied per closed triangle a voter participates in. */
const TRIANGLE_PENALTY = 0.7

/** Minimum weight after all penalties — a vote is never completely discarded. */
const MIN_WEIGHT = 0.4

/**
 * Builds an adjacency set map: voterId → Set of bandIds that voter voted for.
 *
 * @param allBandVotes - Map of bandId → list of bandIds they voted for.
 * @returns New map with values converted to Sets for O(1) membership tests.
 */
function buildAdjacency(allBandVotes: Map<string, string[]>): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  for (const [voter, targets] of allBandVotes) {
    adj.set(voter, new Set(targets))
  }
  return adj
}

/**
 * Counts how many distinct closed triangles the given voter participates in.
 *
 * A closed triangle for voter A is any pair (B, C) where:
 *   A → B, B → C, C → A
 *
 * @param voterId  - The voter whose triangle count we are computing.
 * @param adj      - Adjacency map (output of buildAdjacency).
 * @returns Number of distinct (B, C) triangle completions for this voter.
 */
export function countTrianglesForVoter(
  voterId: string,
  adj: Map<string, Set<string>>
): number {
  const aTargets = adj.get(voterId)
  if (!aTargets || aTargets.size === 0) return 0

  let triangleCount = 0

  for (const b of aTargets) {
    const bTargets = adj.get(b)
    if (!bTargets) continue

    for (const c of bTargets) {
      // c must vote back for a to close the triangle
      const cTargets = adj.get(c)
      if (cTargets?.has(voterId)) {
        triangleCount++
      }
    }
  }

  return triangleCount
}

/**
 * Computes the triadic-census penalty weight multiplier for a single voter.
 *
 * Formula: max(MIN_WEIGHT, TRIANGLE_PENALTY ^ triangleCount)
 *
 * Examples:
 *   0 triangles → 1.0  (no penalty)
 *   1 triangle  → 0.7
 *   2 triangles → 0.49 → clamped to 0.4
 *
 * @param voterId  - The voter whose penalty we are computing.
 * @param adj      - Adjacency map (output of buildAdjacency).
 * @returns Weight multiplier in the range [MIN_WEIGHT, 1.0].
 */
export function computeTriadicPenalty(
  voterId: string,
  adj: Map<string, Set<string>>
): number {
  const triangles = countTrianglesForVoter(voterId, adj)
  if (triangles === 0) return 1.0
  return Math.max(MIN_WEIGHT, Math.pow(TRIANGLE_PENALTY, triangles))
}

/**
 * Applies triadic-census penalties to a set of peer band votes.
 *
 * For each vote, the voter's triangle count is computed and the existing
 * weight is multiplied by the triadic penalty.  Multiple anti-manipulation
 * passes (clique weighting + triadic census) can be composed because each
 * pass only multiplies the existing weight.
 *
 * State is immutable — returns new vote objects without mutating the originals.
 *
 * @param votes        - Raw (or clique-adjusted) peer band votes.
 * @param allBandVotes - Historical vote map used for triangle detection.
 * @returns New array of votes with triadic-census penalties applied.
 */
export function applyTriadicCensusPenalty(
  votes: BandVote[],
  allBandVotes: Map<string, string[]>
): BandVote[] {
  const adj = buildAdjacency(allBandVotes)

  // Pre-compute penalty per voter (memoize to avoid redundant graph traversals)
  const penaltyCache = new Map<string, number>()

  return votes.map(vote => {
    let penalty = penaltyCache.get(vote.voterId)
    if (penalty === undefined) {
      penalty = computeTriadicPenalty(vote.voterId, adj)
      penaltyCache.set(vote.voterId, penalty)
    }
    return { ...vote, weight: vote.weight * penalty }
  })
}
