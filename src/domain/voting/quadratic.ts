import type { FanVote } from '@/lib/types'

/** Maximum voice credits allocated to each fan per monthly voting cycle. */
export const MONTHLY_CREDIT_BUDGET = 100

/**
 * Calculates the voice credit cost for casting a given number of quadratic votes.
 *
 * The quadratic cost function (cost = votes²) prevents wealthy vote accumulation:
 * concentrating all credits on one track becomes exponentially expensive, while
 * spreading votes across multiple tracks is rewarded. This mirrors the academic
 * Quadratic Voting mechanism first proposed by Posner & Weyl (2018).
 *
 * @param votes - The number of votes to cast (must be a non-negative integer).
 * @returns The total credit cost: votes².
 */
export function calculateQuadraticCost(votes: number): number {
  return votes * votes
}

/**
 * Returns the maximum number of votes a user can cast with a given credit budget.
 *
 * Derived from the inverse of the quadratic cost function: floor(√credits).
 * Used by the UI slider to enforce the hard budget ceiling in real time.
 *
 * @param credits - Available voice credits (must be >= 0).
 * @returns Maximum votes castable without exceeding the credit budget.
 */
export function calculateMaxVotesForCredits(credits: number): number {
  return Math.floor(Math.sqrt(credits))
}

/**
 * Validates that a fan's vote allocations do not exceed the monthly credit budget.
 *
 * This validation is executed both client-side (real-time UI feedback) and
 * server-side (POST /api/votes/fan) to prevent any budget bypass attempts.
 * The 100-credit limit resets on the first day of each calendar month.
 *
 * @param votes - Array of all fan votes across tracks for the current period.
 * @returns `valid` flag and `totalCredits` spent so the UI can render the remaining balance.
 */
export function validateFanVotes(votes: FanVote[]): { valid: boolean; totalCredits: number } {
  const totalCredits = votes.reduce((sum, vote) => sum + calculateQuadraticCost(vote.votes), 0)
  return {
    valid: totalCredits <= MONTHLY_CREDIT_BUDGET,
    totalCredits,
  }
}
