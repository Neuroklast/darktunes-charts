import { describe, it, expect } from 'vitest'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'

/**
 * Validates that both locale message files contain all keys required by the
 * UI/UX improvement components (demo banners, category pricing, onboarding tours).
 */

describe('UI/UX i18n – demo banner messages', () => {
  const REQUIRED_DEMO_KEYS = ['chartsBanner', 'scoutingBanner', 'dismiss'] as const

  it.each(REQUIRED_DEMO_KEYS)(
    'de.json demo contains key "%s"',
    (key) => {
      expect(deMessages.demo).toHaveProperty(key)
      expect(deMessages.demo[key as keyof typeof deMessages.demo]).toBeTruthy()
    },
  )

  it.each(REQUIRED_DEMO_KEYS)(
    'en.json demo contains key "%s"',
    (key) => {
      expect(enMessages.demo).toHaveProperty(key)
      expect(enMessages.demo[key as keyof typeof enMessages.demo]).toBeTruthy()
    },
  )

  it('de.json and en.json have the same demo keys', () => {
    const deKeys = Object.keys(deMessages.demo).sort()
    const enKeys = Object.keys(enMessages.demo).sort()
    expect(deKeys).toEqual(enKeys)
  })
})

describe('UI/UX i18n – category pricing messages', () => {
  const REQUIRED_KEYS = ['emptyState', 'emptyStateCost'] as const

  it.each(REQUIRED_KEYS)(
    'de.json categoryPricing contains key "%s"',
    (key) => {
      expect(deMessages.categoryPricing).toHaveProperty(key)
      expect(deMessages.categoryPricing[key as keyof typeof deMessages.categoryPricing]).toBeTruthy()
    },
  )

  it.each(REQUIRED_KEYS)(
    'en.json categoryPricing contains key "%s"',
    (key) => {
      expect(enMessages.categoryPricing).toHaveProperty(key)
      expect(enMessages.categoryPricing[key as keyof typeof enMessages.categoryPricing]).toBeTruthy()
    },
  )
})

describe('UI/UX i18n – onboarding tour messages', () => {
  const FAN_TOUR_KEYS = ['welcome', 'welcomeDesc', 'budget', 'budgetDesc', 'slider', 'sliderDesc', 'submit', 'submitDesc', 'skip', 'next', 'finish'] as const
  const DJ_TOUR_KEYS = ['welcome', 'welcomeDesc', 'dragDrop', 'dragDropDesc', 'schulze', 'schulzeDesc', 'submit', 'submitDesc', 'skip', 'next', 'finish'] as const

  it.each(FAN_TOUR_KEYS)(
    'de.json onboarding.fanTour contains key "%s"',
    (key) => {
      expect(deMessages.onboarding.fanTour).toHaveProperty(key)
    },
  )

  it.each(FAN_TOUR_KEYS)(
    'en.json onboarding.fanTour contains key "%s"',
    (key) => {
      expect(enMessages.onboarding.fanTour).toHaveProperty(key)
    },
  )

  it.each(DJ_TOUR_KEYS)(
    'de.json onboarding.djTour contains key "%s"',
    (key) => {
      expect(deMessages.onboarding.djTour).toHaveProperty(key)
    },
  )

  it.each(DJ_TOUR_KEYS)(
    'en.json onboarding.djTour contains key "%s"',
    (key) => {
      expect(enMessages.onboarding.djTour).toHaveProperty(key)
    },
  )

  it('de.json and en.json have the same onboarding.fanTour keys', () => {
    const deKeys = Object.keys(deMessages.onboarding.fanTour).sort()
    const enKeys = Object.keys(enMessages.onboarding.fanTour).sort()
    expect(deKeys).toEqual(enKeys)
  })

  it('de.json and en.json have the same onboarding.djTour keys', () => {
    const deKeys = Object.keys(deMessages.onboarding.djTour).sort()
    const enKeys = Object.keys(enMessages.onboarding.djTour).sort()
    expect(deKeys).toEqual(enKeys)
  })
})
