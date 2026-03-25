import { describe, it, expect } from 'vitest'
import { isValidEAN, isValidDateString, isValidAmount, fanVoteSchema, djBallotSchema, peerVoteSchema } from '../_lib/validators'

describe('isValidEAN', () => {
  it('returns true for a valid EAN-13', () => {
    expect(isValidEAN('4006381333931')).toBe(true)
  })

  it('returns false for wrong length', () => {
    expect(isValidEAN('123')).toBe(false)
    expect(isValidEAN('40063813339312')).toBe(false)
  })

  it('returns false for non-numeric', () => {
    expect(isValidEAN('400638133393X')).toBe(false)
  })

  it('returns false for invalid checksum', () => {
    expect(isValidEAN('4006381333932')).toBe(false)
  })
})

describe('isValidDateString', () => {
  it('accepts valid ISO dates', () => {
    expect(isValidDateString('2024-01-15')).toBe(true)
    expect(isValidDateString('2000-12-31')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidDateString('15-01-2024')).toBe(false)
    expect(isValidDateString('2024/01/15')).toBe(false)
    expect(isValidDateString('not-a-date')).toBe(false)
  })

  it('rejects impossible dates', () => {
    expect(isValidDateString('2024-13-01')).toBe(false)
  })
})

describe('isValidAmount', () => {
  it('accepts valid amounts', () => {
    expect(isValidAmount('0')).toBe(true)
    expect(isValidAmount('99.99')).toBe(true)
    expect(isValidAmount(150)).toBe(true)
    expect(isValidAmount('1234567.89')).toBe(true)
  })

  it('rejects negative values', () => {
    expect(isValidAmount('-1')).toBe(false)
  })

  it('rejects more than 2 decimal places', () => {
    expect(isValidAmount('9.999')).toBe(false)
  })

  it('rejects non-numeric strings', () => {
    expect(isValidAmount('abc')).toBe(false)
  })
})

describe('fanVoteSchema', () => {
  it('accepts valid fan vote', () => {
    const result = fanVoteSchema.safeParse({ trackId: 'tr1', votes: 5, creditsSpent: 25 })
    expect(result.success).toBe(true)
  })

  it('rejects votes above 10', () => {
    const result = fanVoteSchema.safeParse({ trackId: 'tr1', votes: 11, creditsSpent: 121 })
    expect(result.success).toBe(false)
  })

  it('rejects negative votes', () => {
    const result = fanVoteSchema.safeParse({ trackId: 'tr1', votes: -1, creditsSpent: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects empty trackId', () => {
    const result = fanVoteSchema.safeParse({ trackId: '', votes: 1, creditsSpent: 1 })
    expect(result.success).toBe(false)
  })
})

describe('djBallotSchema', () => {
  it('accepts a valid DJ ballot', () => {
    const result = djBallotSchema.safeParse({ djId: 'dj1', rankings: ['t1', 't2'] })
    expect(result.success).toBe(true)
  })

  it('rejects empty rankings array', () => {
    const result = djBallotSchema.safeParse({ djId: 'dj1', rankings: [] })
    expect(result.success).toBe(false)
  })
})

describe('peerVoteSchema', () => {
  it('accepts a valid peer vote', () => {
    const result = peerVoteSchema.safeParse({ voterId: 'b1', votedBandId: 'b2', weight: 1.0 })
    expect(result.success).toBe(true)
  })

  it('rejects weight above 1', () => {
    const result = peerVoteSchema.safeParse({ voterId: 'b1', votedBandId: 'b2', weight: 1.5 })
    expect(result.success).toBe(false)
  })

  it('rejects weight below 0', () => {
    const result = peerVoteSchema.safeParse({ voterId: 'b1', votedBandId: 'b2', weight: -0.1 })
    expect(result.success).toBe(false)
  })
})
