import { describe, it, expect } from 'vitest'
import {
  validateNomination,
  computeAwardWinner,
  validateAwardVotes,
  selectTopNominees,
  type AwardNominee,
  type AwardVoteInput,
} from '../index'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeNominee(overrides: Partial<AwardNominee> = {}, index = 0): AwardNominee {
  return {
    id: `nominee-${index}`,
    name: `Nominee ${index}`,
    description: 'A great contributor to the scene.',
    nominatedBy: 'user-abc',
    endorsements: index,
    ...overrides,
  }
}

// ─── validateNomination ───────────────────────────────────────────────────────

describe('validateNomination', () => {
  it('passes a valid nomination', () => {
    const { valid, errors } = validateNomination({
      name: 'Dark Oracle',
      description: 'A visionary chronicler of goth culture.',
      nominatedBy: 'user-xyz',
      endorsements: 0,
    })
    expect(valid).toBe(true)
    expect(errors).toHaveLength(0)
  })

  it('fails when name is empty', () => {
    const { valid, errors } = validateNomination({
      name: '',
      description: 'Valid description.',
      nominatedBy: 'user-xyz',
    })
    expect(valid).toBe(false)
    expect(errors.some((e) => e.toLowerCase().includes('name'))).toBe(true)
  })

  it('fails when name exceeds 200 characters', () => {
    const { valid, errors } = validateNomination({
      name: 'x'.repeat(201),
      description: 'Valid description.',
      nominatedBy: 'user-xyz',
    })
    expect(valid).toBe(false)
    expect(errors.some((e) => e.toLowerCase().includes('name'))).toBe(true)
  })

  it('fails when description is empty', () => {
    const { valid, errors } = validateNomination({
      name: 'Valid Name',
      description: '',
      nominatedBy: 'user-xyz',
    })
    expect(valid).toBe(false)
    expect(errors.some((e) => e.toLowerCase().includes('description'))).toBe(true)
  })

  it('fails when description exceeds 1000 characters', () => {
    const { valid, errors } = validateNomination({
      name: 'Valid Name',
      description: 'x'.repeat(1001),
      nominatedBy: 'user-xyz',
    })
    expect(valid).toBe(false)
    expect(errors.some((e) => e.toLowerCase().includes('description'))).toBe(true)
  })

  it('fails when nominatedBy is missing', () => {
    const { valid, errors } = validateNomination({
      name: 'Valid Name',
      description: 'Valid description.',
    })
    expect(valid).toBe(false)
    expect(errors.some((e) => e.toLowerCase().includes('nominatedby'))).toBe(true)
  })

  it('accumulates multiple errors', () => {
    const { errors } = validateNomination({})
    expect(errors.length).toBeGreaterThan(1)
  })
})

// ─── computeAwardWinner ───────────────────────────────────────────────────────

describe('computeAwardWinner', () => {
  const nominees = [makeNominee({}, 0), makeNominee({}, 1), makeNominee({}, 2)]

  it('returns the nominee with the highest quadratic score', () => {
    const votes = [
      { nomineeId: 'nominee-1', credits: 9 },
      { nomineeId: 'nominee-0', credits: 4 },
      { nomineeId: 'nominee-1', credits: 16 },
    ]
    const winner = computeAwardWinner(nominees, votes)
    expect(winner?.id).toBe('nominee-1')
  })

  it('returns null when there are no votes', () => {
    expect(computeAwardWinner(nominees, [])).toBeNull()
  })

  it('uses sqrt(credits) for scoring', () => {
    const votes = [
      { nomineeId: 'nominee-0', credits: 100 },
      { nomineeId: 'nominee-1', credits: 400 },
    ]
    const winner = computeAwardWinner(nominees, votes)
    expect(winner?.id).toBe('nominee-1')
  })

  it('returns null when all nominees have zero votes cast', () => {
    const votes = [{ nomineeId: 'unknown-id', credits: 10 }]
    const result = computeAwardWinner(nominees, votes)
    expect(result).toBeNull()
  })

  it('handles a single nominee with votes', () => {
    const single = [makeNominee({}, 0)]
    const votes = [{ nomineeId: 'nominee-0', credits: 1 }]
    expect(computeAwardWinner(single, votes)?.id).toBe('nominee-0')
  })
})

// ─── validateAwardVotes ───────────────────────────────────────────────────────

describe('validateAwardVotes', () => {
  it('passes when credits² sum is within budget', () => {
    const votes: AwardVoteInput[] = [
      { nomineeId: 'n1', credits: 3 },
      { nomineeId: 'n2', credits: 2 },
    ]
    const { valid, totalUsed } = validateAwardVotes(votes, 20)
    expect(valid).toBe(true)
    expect(totalUsed).toBe(9 + 4)
  })

  it('fails when credits² sum exceeds budget', () => {
    const votes: AwardVoteInput[] = [{ nomineeId: 'n1', credits: 10 }]
    const { valid, error } = validateAwardVotes(votes, 50)
    expect(valid).toBe(false)
    expect(error).toBeDefined()
  })

  it('fails when same nomineeId appears twice', () => {
    const votes: AwardVoteInput[] = [
      { nomineeId: 'n1', credits: 2 },
      { nomineeId: 'n1', credits: 3 },
    ]
    const { valid, error } = validateAwardVotes(votes, 1000)
    expect(valid).toBe(false)
    expect(error).toContain('n1')
  })

  it('passes with empty votes array', () => {
    const { valid, totalUsed } = validateAwardVotes([], 100)
    expect(valid).toBe(true)
    expect(totalUsed).toBe(0)
  })

  it('correctly calculates totalUsed', () => {
    const votes: AwardVoteInput[] = [
      { nomineeId: 'n1', credits: 5 },
      { nomineeId: 'n2', credits: 3 },
    ]
    const { totalUsed } = validateAwardVotes(votes, 1000)
    expect(totalUsed).toBe(25 + 9)
  })
})

// ─── selectTopNominees ────────────────────────────────────────────────────────

describe('selectTopNominees', () => {
  it('returns top N by endorsement count descending', () => {
    const nominees = [
      makeNominee({ endorsements: 5 }, 0),
      makeNominee({ endorsements: 20 }, 1),
      makeNominee({ endorsements: 10 }, 2),
    ]
    const result = selectTopNominees(nominees, 2)
    expect(result[0].endorsements).toBe(20)
    expect(result[1].endorsements).toBe(10)
  })

  it('returns all when count > nominees.length', () => {
    const nominees = [makeNominee({}, 0), makeNominee({}, 1)]
    expect(selectTopNominees(nominees, 10)).toHaveLength(2)
  })

  it('does not mutate the original array', () => {
    const nominees = [
      makeNominee({ endorsements: 1 }, 0),
      makeNominee({ endorsements: 5 }, 1),
    ]
    selectTopNominees(nominees, 1)
    expect(nominees[0].endorsements).toBe(1)
  })

  it('handles empty array', () => {
    expect(selectTopNominees([], 5)).toEqual([])
  })

  it('returns empty when count is 0', () => {
    const nominees = [makeNominee({}, 0)]
    expect(selectTopNominees(nominees, 0)).toEqual([])
  })
})
