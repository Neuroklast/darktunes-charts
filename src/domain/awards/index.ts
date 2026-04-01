/**
 * @module domain/awards
 *
 * Pure domain logic for the darkTunes Community Awards system.
 *
 * Handles nomination validation, quadratic voting, winner computation,
 * and finalist selection by endorsement count.
 *
 * Quadratic voting rationale: requiring voters to spend credits² per nominee
 * prevents whale concentration and forces voters to spread conviction across
 * multiple nominees rather than dumping all credits on one.
 *
 * All functions are pure (no side effects, no I/O).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AwardCategory =
  | 'chronicler-of-the-night'
  | 'dark-integrity'
  | 'newcomer-of-the-year'
  | 'compilation-track-of-year'
  | 'dj-of-the-year'

export interface Award {
  id: string
  category: AwardCategory
  year: number
  nominees: AwardNominee[]
  winner?: AwardNominee
  votingOpen: boolean
  votingStartDate: Date
  votingEndDate: Date
}

export interface AwardNominee {
  id: string
  name: string
  description: string
  nominatedBy: string
  endorsements: number
  isFinalNominee?: boolean
}

export interface AwardVoteInput {
  nomineeId: string
  credits: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NOMINEE_NAME_LENGTH = 200
const MAX_NOMINEE_DESC_LENGTH = 1000

// ─── Exported pure functions ──────────────────────────────────────────────────

/**
 * Validates a nomination submission before it is persisted.
 *
 * Constraints:
 * - name: 1–200 characters.
 * - description: 1–1000 characters.
 * - nominatedBy must be a non-empty string.
 *
 * @param nominee - Partial nominee data from the request body.
 * @returns Validation result with a list of human-readable errors.
 */
export function validateNomination(
  nominee: Partial<AwardNominee>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const name = nominee.name?.trim() ?? ''
  if (name.length < 1 || name.length > MAX_NOMINEE_NAME_LENGTH) {
    errors.push(`Name must be 1–${MAX_NOMINEE_NAME_LENGTH} characters.`)
  }

  const description = nominee.description?.trim() ?? ''
  if (description.length < 1 || description.length > MAX_NOMINEE_DESC_LENGTH) {
    errors.push(`Description must be 1–${MAX_NOMINEE_DESC_LENGTH} characters.`)
  }

  const nominatedBy = nominee.nominatedBy?.trim() ?? ''
  if (nominatedBy.length === 0) {
    errors.push('nominatedBy is required.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Computes the award winner using quadratic voting.
 *
 * Each vote contributes sqrt(credits) power to the nominee's total score.
 * This follows standard QV mechanics where the marginal cost of influence
 * grows quadratically, preventing any single voter from dominating.
 *
 * @param nominees - The final nominees eligible to win.
 * @param votes - All votes cast in this award.
 * @returns The winning AwardNominee, or null if no votes were cast.
 */
export function computeAwardWinner(
  nominees: AwardNominee[],
  votes: Array<{ nomineeId: string; credits: number }>,
): AwardNominee | null {
  if (votes.length === 0) return null

  const scoreMap = new Map<string, number>()

  for (const nominee of nominees) {
    scoreMap.set(nominee.id, 0)
  }

  for (const vote of votes) {
    const current = scoreMap.get(vote.nomineeId) ?? 0
    scoreMap.set(vote.nomineeId, current + Math.sqrt(vote.credits))
  }

  let bestNominee: AwardNominee | null = null
  let bestScore = -1

  for (const nominee of nominees) {
    const score = scoreMap.get(nominee.id) ?? 0
    if (score > bestScore) {
      bestScore = score
      bestNominee = nominee
    }
  }

  return bestScore > 0 ? bestNominee : null
}

/**
 * Validates a batch of quadratic award votes from a single user.
 *
 * Quadratic rule: the sum of all credits² must not exceed the user's budget.
 * Each nomineeId must appear only once per submission.
 *
 * @param votes - The votes the user intends to cast.
 * @param totalCredits - The user's available credit budget.
 * @returns Validation result with total credits used and an optional error message.
 */
export function validateAwardVotes(
  votes: AwardVoteInput[],
  totalCredits: number,
): { valid: boolean; totalUsed: number; error?: string } {
  const seenNominees = new Set<string>()

  for (const vote of votes) {
    if (seenNominees.has(vote.nomineeId)) {
      return {
        valid: false,
        totalUsed: 0,
        error: `Duplicate nomineeId: ${vote.nomineeId}`,
      }
    }
    seenNominees.add(vote.nomineeId)
  }

  const totalUsed = votes.reduce((sum, v) => sum + v.credits * v.credits, 0)

  if (totalUsed > totalCredits) {
    return {
      valid: false,
      totalUsed,
      error: `Credits² sum (${totalUsed}) exceeds budget (${totalCredits}).`,
    }
  }

  return { valid: true, totalUsed }
}

/**
 * Selects the top N nominees by endorsement count when closing nominations.
 *
 * Ties are broken by insertion order (stable sort in V8 / Node.js ≥11).
 *
 * @param nominees - All nominees for an award.
 * @param count - Number of finalists to select.
 * @returns Top N nominees sorted by endorsements descending.
 */
export function selectTopNominees(nominees: AwardNominee[], count: number): AwardNominee[] {
  return [...nominees]
    .sort((a, b) => b.endorsements - a.endorsements)
    .slice(0, count)
}
