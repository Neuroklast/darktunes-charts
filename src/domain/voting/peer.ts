import type { BandVote } from '@/lib/types'

/**
 * Computes an anti-collusion weight for a peer vote using network clique detection.
 *
 * Algorithm:
 * 1. Detect reciprocal voting (A votes B AND B votes A).
 * 2. Count mutual connections: bands that both A and B have voted for.
 * 3. Apply a graduated penalty: each mutual connection reduces weight by 15%,
 *    capped at a minimum weight of 0.4 (never fully discards a vote).
 *
 * Research basis: 60 years of Eurovision Song Contest analysis reveals that
 * geographic and cultural blocs form voting rings. This coefficient disrupts
 * such rings while preserving genuine peer appreciation.
 *
 * @param voterId - The ID of the band casting the vote.
 * @param votedForId - The ID of the band receiving the vote.
 * @param allBandVotes - Map of bandId → list of bandIds that band has voted for.
 * @returns A weight multiplier in the range [0.4, 1.0].
 *          1.0 = clean vote (no reciprocity); 0.4 = heavily penalised clique vote.
 */
export function calculateCliqueCoefficient(
  voterId: string,
  votedForId: string,
  allBandVotes: Map<string, string[]>
): number {
  const voterVotedFor = allBandVotes.get(voterId) ?? []
  const votedForVotedFor = allBandVotes.get(votedForId) ?? []

  const hasReciprocalVote = votedForVotedFor.includes(voterId)

  if (!hasReciprocalVote) {
    return 1.0
  }

  const mutualConnections = voterVotedFor.filter(id => votedForVotedFor.includes(id)).length
  const cliqueFactor = Math.min(mutualConnections * 0.15, 0.6)

  return Math.max(1.0 - cliqueFactor, 0.4)
}

/**
 * Applies clique-adjusted weights to a set of peer votes.
 *
 * Processes each vote through `calculateCliqueCoefficient` and multiplies the
 * existing weight, so multiple anti-manipulation passes can be composed.
 * State is immutable — returns new vote objects without mutating the originals.
 *
 * @param votes - Raw peer band votes (each must include `voterId` and `votedBandId`).
 * @param allBandVotes - Historical vote map used for clique detection.
 * @returns New array of votes with anti-collusion weights applied.
 */
export function applyCliqueWeighting(votes: BandVote[], allBandVotes: Map<string, string[]>): BandVote[] {
  return votes.map(vote => ({
    ...vote,
    weight: calculateCliqueCoefficient(vote.voterId, vote.votedBandId, allBandVotes) * vote.weight,
  }))
}
