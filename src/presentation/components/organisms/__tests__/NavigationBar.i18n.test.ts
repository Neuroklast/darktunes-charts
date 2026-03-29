import { describe, it, expect } from 'vitest'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'

/**
 * Validates that both locale message files contain all navigation keys
 * required by the NavigationBar component.
 *
 * These keys correspond to:
 * - NAV_LINKS labelKeys (charts, categories, fanVote, djVote, anr, transparency)
 * - Auth labels (login, logout)
 * - Utility labels (security, tagline)
 */

/** All navigation keys referenced by NavigationBar.tsx */
const REQUIRED_NAV_KEYS = [
  'charts',
  'categories',
  'fanVote',
  'djVote',
  'anr',
  'transparency',
  'login',
  'logout',
  'security',
  'tagline',
] as const

describe('NavigationBar i18n – message file completeness', () => {
  it.each(REQUIRED_NAV_KEYS)(
    'de.json navigation contains key "%s"',
    (key) => {
      expect(deMessages.navigation).toHaveProperty(key)
      expect(deMessages.navigation[key as keyof typeof deMessages.navigation]).toBeTruthy()
    },
  )

  it.each(REQUIRED_NAV_KEYS)(
    'en.json navigation contains key "%s"',
    (key) => {
      expect(enMessages.navigation).toHaveProperty(key)
      expect(enMessages.navigation[key as keyof typeof enMessages.navigation]).toBeTruthy()
    },
  )

  it('de.json and en.json have the same navigation keys', () => {
    const deKeys = Object.keys(deMessages.navigation).sort()
    const enKeys = Object.keys(enMessages.navigation).sort()
    expect(deKeys).toEqual(enKeys)
  })

  it('navigation labels are non-empty strings in both locales', () => {
    for (const key of REQUIRED_NAV_KEYS) {
      const deValue = deMessages.navigation[key as keyof typeof deMessages.navigation]
      const enValue = enMessages.navigation[key as keyof typeof enMessages.navigation]
      expect(typeof deValue).toBe('string')
      expect(typeof enValue).toBe('string')
      expect((deValue as string).length).toBeGreaterThan(0)
      expect((enValue as string).length).toBeGreaterThan(0)
    }
  })

  it('German locale has correct navigation labels', () => {
    const nav = deMessages.navigation
    expect(nav.fanVote).toBe('Fan Vote')
    expect(nav.djVote).toBe('DJ Vote')
    expect(nav.anr).toBe('A&R')
    expect(nav.transparency).toBe('Log')
    expect(nav.security).toBe('Sicherheit')
    expect(nav.tagline).toBe('Fair · Transparent · Innovativ')
    expect(nav.logout).toBe('Abmelden')
    expect(nav.login).toBe('Anmelden')
  })

  it('English locale has correct navigation labels', () => {
    const nav = enMessages.navigation
    expect(nav.fanVote).toBe('Fan Vote')
    expect(nav.djVote).toBe('DJ Vote')
    expect(nav.anr).toBe('A&R')
    expect(nav.transparency).toBe('Log')
    expect(nav.security).toBe('Security')
    expect(nav.tagline).toBe('Fair · Transparent · Innovative')
    expect(nav.logout).toBe('Log out')
    expect(nav.login).toBe('Log in')
  })
})
