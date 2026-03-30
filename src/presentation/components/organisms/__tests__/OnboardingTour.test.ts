import { describe, it, expect, beforeEach } from 'vitest'
import { resetOnboardingTour } from '../../molecules/OnboardingTour'

describe('OnboardingTour – localStorage persistence', () => {
  const STORAGE_PREFIX = 'darktunes-tour-'

  beforeEach(() => {
    localStorage.clear()
  })

  it('tour key is not set by default', () => {
    expect(localStorage.getItem(`${STORAGE_PREFIX}fan-voting`)).toBeNull()
  })

  it('resetOnboardingTour removes the persisted key', () => {
    localStorage.setItem(`${STORAGE_PREFIX}fan-voting`, 'true')
    expect(localStorage.getItem(`${STORAGE_PREFIX}fan-voting`)).toBe('true')

    resetOnboardingTour('fan-voting')
    expect(localStorage.getItem(`${STORAGE_PREFIX}fan-voting`)).toBeNull()
  })

  it('resetOnboardingTour is safe when key does not exist', () => {
    expect(() => resetOnboardingTour('non-existent')).not.toThrow()
  })

  it('persists completion state for multiple tours independently', () => {
    localStorage.setItem(`${STORAGE_PREFIX}fan-voting`, 'true')
    localStorage.setItem(`${STORAGE_PREFIX}dj-voting`, 'true')

    resetOnboardingTour('fan-voting')

    expect(localStorage.getItem(`${STORAGE_PREFIX}fan-voting`)).toBeNull()
    expect(localStorage.getItem(`${STORAGE_PREFIX}dj-voting`)).toBe('true')
  })
})
