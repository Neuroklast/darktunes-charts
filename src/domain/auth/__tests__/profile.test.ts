import { describe, it, expect } from 'vitest'
import {
  CreateProfileSchema,
  dashboardPathForRole,
  extractRoleFromMetadata,
  getRoleOptions,
  REGISTERABLE_ROLES,
} from '../profile'

describe('CreateProfileSchema', () => {
  it('accepts a valid fan payload', () => {
    const result = CreateProfileSchema.safeParse({ name: 'Dark Fan', role: 'fan' })
    expect(result.success).toBe(true)
  })

  it('accepts a band payload with bandName', () => {
    const result = CreateProfileSchema.safeParse({
      name: 'Max Muster',
      role: 'band',
      bandName: 'Black Void',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.bandName).toBe('Black Void')
  })

  it('rejects a name that is too short', () => {
    const result = CreateProfileSchema.safeParse({ name: 'X', role: 'fan' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.message).toMatch(/2 Zeichen/)
  })

  it('rejects an invalid role', () => {
    const result = CreateProfileSchema.safeParse({ name: 'Test User', role: 'admin' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.message).toMatch(/gültige Rolle/)
  })

  it('trims whitespace from name', () => {
    const result = CreateProfileSchema.safeParse({ name: '  Dark Fan  ', role: 'fan' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.name).toBe('Dark Fan')
  })

  it('rejects a name that is too long', () => {
    const result = CreateProfileSchema.safeParse({ name: 'A'.repeat(81), role: 'fan' })
    expect(result.success).toBe(false)
  })
})

describe('dashboardPathForRole', () => {
  it('returns /dashboard/fan for fan role', () => {
    expect(dashboardPathForRole('fan')).toBe('/dashboard/fan')
  })

  it('returns /dashboard/band for band role', () => {
    expect(dashboardPathForRole('band')).toBe('/dashboard/band')
  })

  it('returns /dashboard/dj for dj role', () => {
    expect(dashboardPathForRole('dj')).toBe('/dashboard/dj')
  })

  it('returns /admin for admin role', () => {
    expect(dashboardPathForRole('admin')).toBe('/admin')
  })

  it('returns /dashboard/label for ar role', () => {
    expect(dashboardPathForRole('ar')).toBe('/dashboard/label')
  })

  it('returns /dashboard/fan for editor role', () => {
    expect(dashboardPathForRole('editor')).toBe('/dashboard/fan')
  })
})

describe('extractRoleFromMetadata', () => {
  it('returns a valid role from metadata', () => {
    expect(extractRoleFromMetadata({ darktunes_role: 'fan' })).toBe('fan')
    expect(extractRoleFromMetadata({ darktunes_role: 'band' })).toBe('band')
    expect(extractRoleFromMetadata({ darktunes_role: 'dj' })).toBe('dj')
    expect(extractRoleFromMetadata({ darktunes_role: 'editor' })).toBe('editor')
  })

  it('returns null for non-registerable roles', () => {
    expect(extractRoleFromMetadata({ darktunes_role: 'admin' })).toBeNull()
    expect(extractRoleFromMetadata({ darktunes_role: 'ar' })).toBeNull()
    expect(extractRoleFromMetadata({ darktunes_role: 'label' })).toBeNull()
  })

  it('returns null when metadata key is absent', () => {
    expect(extractRoleFromMetadata({})).toBeNull()
  })

  it('returns null when value is not a string', () => {
    expect(extractRoleFromMetadata({ darktunes_role: 42 })).toBeNull()
    expect(extractRoleFromMetadata({ darktunes_role: null })).toBeNull()
  })
})

describe('getRoleOptions', () => {
  it('returns an option for each registerable role', () => {
    const options = getRoleOptions()
    const roles = options.map((o) => o.role)
    for (const role of REGISTERABLE_ROLES) {
      expect(roles).toContain(role)
    }
  })

  it('marks dj as requiring KYC', () => {
    const options = getRoleOptions()
    const dj = options.find((o) => o.role === 'dj')
    expect(dj?.requiresKyc).toBe(true)
  })

  it('marks fan and band as not requiring KYC', () => {
    const options = getRoleOptions()
    const fan = options.find((o) => o.role === 'fan')
    const band = options.find((o) => o.role === 'band')
    expect(fan?.requiresKyc).toBe(false)
    expect(band?.requiresKyc).toBe(false)
  })

  it('returns non-empty labels and descriptions', () => {
    const options = getRoleOptions()
    for (const option of options) {
      expect(option.label.length).toBeGreaterThan(0)
      expect(option.description.length).toBeGreaterThan(0)
    }
  })
})
