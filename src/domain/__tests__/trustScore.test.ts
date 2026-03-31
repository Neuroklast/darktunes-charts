import { describe, it, expect } from 'vitest'
import { calculateTrustScore, type TrustFactors } from '../security/trustScore'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Factory for building TrustFactors with sensible defaults. */
function factors(overrides: Partial<TrustFactors> = {}): TrustFactors {
  return {
    accountAgeMs: 30 * MS_PER_DAY,   // 30 days — 'established' by default
    hasVerifiedOAuth: true,
    oauthProviderCount: 1,
    votingCyclesCompleted: 1,
    botFlagCount: 0,
    profileCompletenessPercent: 80,
    ...overrides,
  }
}

describe('calculateTrustScore — trust levels', () => {
  it('day 0: multiplier 0.0, level "new"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 0 }))
    expect(result.multiplier).toBe(0.0)
    expect(result.level).toBe('new')
  })

  it('day 1: multiplier 0.1, level "new"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 1 * MS_PER_DAY }))
    expect(result.multiplier).toBeCloseTo(0.1)
    expect(result.level).toBe('new')
  })

  it('day 6: still level "new"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 6 * MS_PER_DAY }))
    expect(result.level).toBe('new')
  })

  it('day 7: level "building" with verified OAuth → multiplier 0.25', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 7 * MS_PER_DAY, hasVerifiedOAuth: true }))
    expect(result.level).toBe('building')
    expect(result.multiplier).toBeCloseTo(0.25)
  })

  it('day 7: level "building" WITHOUT verified OAuth → multiplier stays 0.1', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 7 * MS_PER_DAY, hasVerifiedOAuth: false }))
    expect(result.level).toBe('building')
    expect(result.multiplier).toBeCloseTo(0.1)
  })

  it('day 29: still level "building"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 29 * MS_PER_DAY }))
    expect(result.level).toBe('building')
  })

  it('day 30: level "established" → multiplier 0.5', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 30 * MS_PER_DAY }))
    expect(result.level).toBe('established')
    expect(result.multiplier).toBeCloseTo(0.5)
  })

  it('day 89: still level "established"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 89 * MS_PER_DAY }))
    expect(result.level).toBe('established')
  })

  it('day 90: level "trusted" → multiplier 0.75', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 90 * MS_PER_DAY }))
    expect(result.level).toBe('trusted')
    expect(result.multiplier).toBeCloseTo(0.75)
  })

  it('day 364: still level "trusted"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 364 * MS_PER_DAY }))
    expect(result.level).toBe('trusted')
  })

  it('day 365: level "veteran" → multiplier 1.0', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 365 * MS_PER_DAY }))
    expect(result.level).toBe('veteran')
    expect(result.multiplier).toBeCloseTo(1.0)
  })

  it('day 1000: still level "veteran"', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 1000 * MS_PER_DAY }))
    expect(result.level).toBe('veteran')
    expect(result.multiplier).toBeCloseTo(1.0)
  })
})

describe('calculateTrustScore — OAuth bonus', () => {
  it('adds +0.1 for 2+ OAuth providers', () => {
    const base = calculateTrustScore(factors({ oauthProviderCount: 1 }))
    const bonus = calculateTrustScore(factors({ oauthProviderCount: 2 }))
    expect(bonus.multiplier).toBeCloseTo(base.multiplier + 0.1)
  })

  it('adds +0.1 for 3+ OAuth providers (not stacked beyond first bonus)', () => {
    const result = calculateTrustScore(factors({ oauthProviderCount: 3 }))
    const singleProvider = calculateTrustScore(factors({ oauthProviderCount: 1 }))
    expect(result.multiplier).toBeCloseTo(singleProvider.multiplier + 0.1)
  })

  it('OAuth bonus does not push multiplier above 1.0', () => {
    const result = calculateTrustScore(factors({
      accountAgeMs: 365 * MS_PER_DAY,  // veteran → 1.0
      oauthProviderCount: 2,
    }))
    expect(result.multiplier).toBe(1.0)
  })
})

describe('calculateTrustScore — bot flag penalty', () => {
  it('reduces multiplier by 0.15 per confirmed bot flag', () => {
    const clean = calculateTrustScore(factors({ botFlagCount: 0 }))
    const oneFlag = calculateTrustScore(factors({ botFlagCount: 1 }))
    expect(oneFlag.multiplier).toBeCloseTo(clean.multiplier - 0.15)
  })

  it('two bot flags reduce multiplier by 0.30', () => {
    const clean = calculateTrustScore(factors({ botFlagCount: 0 }))
    const twoFlags = calculateTrustScore(factors({ botFlagCount: 2 }))
    expect(twoFlags.multiplier).toBeCloseTo(clean.multiplier - 0.30)
  })

  it('multiplier never drops below 0.0 regardless of bot flags', () => {
    const result = calculateTrustScore(factors({ botFlagCount: 100, accountAgeMs: 0 }))
    expect(result.multiplier).toBe(0.0)
  })
})

describe('calculateTrustScore — effectiveCredits', () => {
  it('effectiveCredits = floor(100 * multiplier) with default 100 credits', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 30 * MS_PER_DAY }))
    expect(result.effectiveCredits).toBe(Math.floor(100 * result.multiplier))
  })

  it('effectiveCredits respects custom totalCredits parameter', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 30 * MS_PER_DAY }), 200)
    expect(result.effectiveCredits).toBe(Math.floor(200 * result.multiplier))
  })

  it('effectiveCredits is 0 on day 0', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 0 }))
    expect(result.effectiveCredits).toBe(0)
  })

  it('effectiveCredits is 100 for veteran with no bot flags', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 365 * MS_PER_DAY }))
    expect(result.effectiveCredits).toBe(100)
  })
})

describe('calculateTrustScore — reasons array', () => {
  it('reasons array is non-empty', () => {
    const result = calculateTrustScore(factors())
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('mentions OAuth penalty absence when no OAuth on "building"', () => {
    const result = calculateTrustScore(factors({
      accountAgeMs: 10 * MS_PER_DAY,
      hasVerifiedOAuth: false,
    }))
    const combined = result.reasons.join(' ')
    expect(combined.toLowerCase()).toContain('oauth')
  })

  it('includes bot flag penalty reason when flags are present', () => {
    const result = calculateTrustScore(factors({ botFlagCount: 2 }))
    const combined = result.reasons.join(' ')
    expect(combined).toContain('bot')
  })

  it('includes OAuth bonus reason when 2+ providers', () => {
    const result = calculateTrustScore(factors({ oauthProviderCount: 2 }))
    const combined = result.reasons.join(' ')
    expect(combined.toLowerCase()).toContain('oauth')
    expect(combined).toContain('+0.1')
  })
})

describe('calculateTrustScore — nextLevelAt', () => {
  it('is undefined for veterans', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 400 * MS_PER_DAY }))
    expect(result.nextLevelAt).toBeUndefined()
  })

  it('is defined and mentions next level for non-veteran', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: 30 * MS_PER_DAY }))
    expect(result.nextLevelAt).toBeDefined()
    expect(result.nextLevelAt).toContain('trusted')
  })

  it('shows correct days remaining for "new" level on day 3', () => {
    // Day 3 → next threshold at 7 days → 4 days remaining
    const result = calculateTrustScore(factors({ accountAgeMs: 3 * MS_PER_DAY }))
    expect(result.nextLevelAt).toContain('4')
  })
})

describe('calculateTrustScore — edge cases', () => {
  it('clamps account age to 0 for future-created accounts (negative ms)', () => {
    const result = calculateTrustScore(factors({ accountAgeMs: -100000 }))
    expect(result.multiplier).toBe(0.0)
    expect(result.level).toBe('new')
  })

  it('multiplier never exceeds 1.0', () => {
    const result = calculateTrustScore(factors({
      accountAgeMs: 1000 * MS_PER_DAY,
      oauthProviderCount: 5,
      botFlagCount: 0,
    }))
    expect(result.multiplier).toBeLessThanOrEqual(1.0)
  })

  it('multiplier never goes below 0.0', () => {
    const result = calculateTrustScore(factors({
      accountAgeMs: 1 * MS_PER_DAY,
      botFlagCount: 50,
    }))
    expect(result.multiplier).toBeGreaterThanOrEqual(0.0)
  })
})
