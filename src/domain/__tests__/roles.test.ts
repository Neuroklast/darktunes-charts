import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  ROLE_PERMISSIONS,
} from '../auth/roles'

describe('ROLE_PERMISSIONS', () => {
  it('defines permissions for all 5 roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(5)
    expect(ROLE_PERMISSIONS.fan).toBeDefined()
    expect(ROLE_PERMISSIONS.dj).toBeDefined()
    expect(ROLE_PERMISSIONS.band).toBeDefined()
    expect(ROLE_PERMISSIONS.curator).toBeDefined()
    expect(ROLE_PERMISSIONS.label).toBeDefined()
  })
})

describe('hasPermission', () => {
  it('allows fans to vote:fan', () => {
    expect(hasPermission('fan', 'vote:fan')).toBe(true)
  })

  it('denies fans vote:dj', () => {
    expect(hasPermission('fan', 'vote:dj')).toBe(false)
  })

  it('allows DJs to vote:dj', () => {
    expect(hasPermission('dj', 'vote:dj')).toBe(true)
  })

  it('denies DJs vote:fan', () => {
    expect(hasPermission('dj', 'vote:fan')).toBe(false)
  })

  it('allows bands to submit:release', () => {
    expect(hasPermission('band', 'submit:release')).toBe(true)
  })

  it('denies bands vote:fan', () => {
    expect(hasPermission('band', 'vote:fan')).toBe(false)
  })

  it('allows curators to curate:compilation', () => {
    expect(hasPermission('curator', 'curate:compilation')).toBe(true)
  })

  it('allows curators to review:dj-application', () => {
    expect(hasPermission('curator', 'review:dj-application')).toBe(true)
  })

  it('allows curators to vote:dj', () => {
    expect(hasPermission('curator', 'vote:dj')).toBe(true)
  })

  it('allows labels to manage:roster', () => {
    expect(hasPermission('label', 'manage:roster')).toBe(true)
  })

  it('allows labels to submit:promo', () => {
    expect(hasPermission('label', 'submit:promo')).toBe(true)
  })

  it('allows labels to book:ad-slot', () => {
    expect(hasPermission('label', 'book:ad-slot')).toBe(true)
  })

  it('denies labels vote:fan', () => {
    expect(hasPermission('label', 'vote:fan')).toBe(false)
  })

  it('allows bands to submit:promo', () => {
    expect(hasPermission('band', 'submit:promo')).toBe(true)
  })
})
