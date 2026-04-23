import { describe, it, expect } from 'vitest'
import { getTierBadgeVariant } from '../utils'

describe('getTierBadgeVariant', () => {
  it('returns destructive for Macro tier', () => {
    expect(getTierBadgeVariant('Macro')).toBe('destructive')
  })

  it('returns destructive for International tier', () => {
    expect(getTierBadgeVariant('International')).toBe('destructive')
  })

  it('returns default for Established tier', () => {
    expect(getTierBadgeVariant('Established')).toBe('default')
  })

  it('returns secondary for Emerging tier', () => {
    expect(getTierBadgeVariant('Emerging')).toBe('secondary')
  })

  it('returns outline for Micro tier (default case)', () => {
    expect(getTierBadgeVariant('Micro')).toBe('outline')
  })

  it('returns outline for unknown tier', () => {
    expect(getTierBadgeVariant('Unknown')).toBe('outline')
  })
})
