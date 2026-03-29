import { describe, it, expect } from 'vitest'
import {
  calculateTrialStatus,
  isTrialExpired,
  buildTrialMetadata,
} from '@/domain/payment/trialStatus'
import {
  TRIAL_PERIOD_DAYS,
  TRIAL_WARNING_DAYS,
  STRIPE_TRIAL_METADATA_KEY,
  STRIPE_TRIAL_METADATA_VALUE,
} from '@/domain/payment/trialConfig'

describe('trialConfig constants', () => {
  it('defines a 30-day trial period', () => {
    expect(TRIAL_PERIOD_DAYS).toBe(30)
  })

  it('defines a 7-day warning threshold', () => {
    expect(TRIAL_WARNING_DAYS).toBe(7)
  })

  it('defines Stripe metadata key and value', () => {
    expect(STRIPE_TRIAL_METADATA_KEY).toBe('is_trial')
    expect(STRIPE_TRIAL_METADATA_VALUE).toBe('true')
  })
})

describe('calculateTrialStatus', () => {
  const fixedNow = new Date('2026-03-29T12:00:00Z')

  it('returns phase "none" when trialStartDate is null', () => {
    const result = calculateTrialStatus(null, fixedNow)
    expect(result.phase).toBe('none')
    expect(result.daysRemaining).toBe(0)
    expect(result.daysElapsed).toBe(0)
    expect(result.shouldNotify).toBe(false)
    expect(result.startDate).toBeNull()
    expect(result.endDate).toBeNull()
  })

  it('returns phase "active" for a trial started today', () => {
    const result = calculateTrialStatus('2026-03-29T00:00:00Z', fixedNow)
    expect(result.phase).toBe('active')
    expect(result.daysRemaining).toBe(TRIAL_PERIOD_DAYS)
    expect(result.daysElapsed).toBe(0)
    expect(result.shouldNotify).toBe(false)
    expect(result.totalDays).toBe(TRIAL_PERIOD_DAYS)
  })

  it('returns phase "active" for a trial 10 days in', () => {
    const startDate = new Date(fixedNow)
    startDate.setDate(startDate.getDate() - 10)
    const result = calculateTrialStatus(startDate.toISOString(), fixedNow)
    expect(result.phase).toBe('active')
    expect(result.daysRemaining).toBe(20)
    expect(result.daysElapsed).toBe(10)
    expect(result.shouldNotify).toBe(false)
  })

  it('returns phase "warning" when exactly 7 days remain', () => {
    const startDate = new Date(fixedNow)
    startDate.setDate(startDate.getDate() - (TRIAL_PERIOD_DAYS - TRIAL_WARNING_DAYS))
    const result = calculateTrialStatus(startDate.toISOString(), fixedNow)
    expect(result.phase).toBe('warning')
    expect(result.daysRemaining).toBe(TRIAL_WARNING_DAYS)
    expect(result.shouldNotify).toBe(true)
  })

  it('returns phase "warning" when 1 day remains', () => {
    const startDate = new Date(fixedNow)
    startDate.setDate(startDate.getDate() - (TRIAL_PERIOD_DAYS - 1))
    const result = calculateTrialStatus(startDate.toISOString(), fixedNow)
    expect(result.phase).toBe('warning')
    expect(result.daysRemaining).toBe(1)
    expect(result.shouldNotify).toBe(true)
  })

  it('returns phase "expired" when exactly 30 days have passed', () => {
    const startDate = new Date(fixedNow)
    startDate.setDate(startDate.getDate() - TRIAL_PERIOD_DAYS)
    const result = calculateTrialStatus(startDate.toISOString(), fixedNow)
    expect(result.phase).toBe('expired')
    expect(result.daysRemaining).toBe(0)
    expect(result.shouldNotify).toBe(false)
  })

  it('returns phase "expired" when 45 days have passed', () => {
    const startDate = new Date(fixedNow)
    startDate.setDate(startDate.getDate() - 45)
    const result = calculateTrialStatus(startDate.toISOString(), fixedNow)
    expect(result.phase).toBe('expired')
    expect(result.daysRemaining).toBe(0)
    expect(result.daysElapsed).toBe(45)
  })

  it('provides valid startDate and endDate ISO strings', () => {
    const result = calculateTrialStatus('2026-03-01T00:00:00Z', fixedNow)
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    const end = new Date(result.endDate!)
    const start = new Date(result.startDate!)
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(TRIAL_PERIOD_DAYS)
  })

  it('shouldNotify is false for "none" and "expired" phases', () => {
    expect(calculateTrialStatus(null, fixedNow).shouldNotify).toBe(false)

    const expired = new Date(fixedNow)
    expired.setDate(expired.getDate() - 31)
    expect(calculateTrialStatus(expired.toISOString(), fixedNow).shouldNotify).toBe(false)
  })

  it('totalDays always equals TRIAL_PERIOD_DAYS', () => {
    expect(calculateTrialStatus(null).totalDays).toBe(TRIAL_PERIOD_DAYS)
    expect(calculateTrialStatus('2026-01-01T00:00:00Z', fixedNow).totalDays).toBe(TRIAL_PERIOD_DAYS)
  })

  it('trial status has NO ranking-related properties (Spec §3.2)', () => {
    const result = calculateTrialStatus('2026-03-15T00:00:00Z', fixedNow)
    expect(result).not.toHaveProperty('rankingWeight')
    expect(result).not.toHaveProperty('votingBonus')
    expect(result).not.toHaveProperty('chartScore')
  })
})

describe('isTrialExpired', () => {
  const fixedNow = new Date('2026-03-29T12:00:00Z')

  it('returns false when trialStartDate is null', () => {
    expect(isTrialExpired(null, fixedNow)).toBe(false)
  })

  it('returns false for an active trial', () => {
    expect(isTrialExpired('2026-03-20T00:00:00Z', fixedNow)).toBe(false)
  })

  it('returns true when the trial period has elapsed', () => {
    const startDate = new Date(fixedNow)
    startDate.setDate(startDate.getDate() - TRIAL_PERIOD_DAYS)
    expect(isTrialExpired(startDate.toISOString(), fixedNow)).toBe(true)
  })
})

describe('buildTrialMetadata', () => {
  it('returns metadata record with trial flag and start date', () => {
    const startDate = '2026-03-01T00:00:00.000Z'
    const meta = buildTrialMetadata(startDate)
    expect(meta.is_trial).toBe('true')
    expect(meta.trial_start).toBe(startDate)
    expect(meta.trial_period_days).toBe(String(TRIAL_PERIOD_DAYS))
  })

  it('returns all string values (Stripe metadata requirement)', () => {
    const meta = buildTrialMetadata('2026-03-01T00:00:00Z')
    Object.values(meta).forEach((value) => {
      expect(typeof value).toBe('string')
    })
  })
})
