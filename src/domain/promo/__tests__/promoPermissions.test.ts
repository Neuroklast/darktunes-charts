import { describe, it, expect } from 'vitest'
import { canSubmitPromo, PROMO_ALLOWED_ROLES } from '../index'

describe('canSubmitPromo', () => {
  const BAND_OWNER_ID = 'user-band-owner'
  const LABEL_USER_ID = 'user-label-admin'
  const OTHER_USER_ID = 'user-other'
  const BAND_LABEL_ID = 'label-abc'

  describe('ADMIN role', () => {
    it('can submit promo for any band', () => {
      expect(canSubmitPromo('ADMIN', 'admin-user', BAND_OWNER_ID, null, [])).toBe(true)
      expect(canSubmitPromo('ADMIN', 'admin-user', BAND_OWNER_ID, BAND_LABEL_ID, [])).toBe(true)
    })
  })

  describe('BAND role', () => {
    it('can submit promo for their own band', () => {
      expect(canSubmitPromo('BAND', BAND_OWNER_ID, BAND_OWNER_ID, null, [])).toBe(true)
    })

    it('cannot submit promo for another band', () => {
      expect(canSubmitPromo('BAND', OTHER_USER_ID, BAND_OWNER_ID, null, [])).toBe(false)
    })

    it('cannot submit promo for another band even with same labelId', () => {
      expect(canSubmitPromo('BAND', OTHER_USER_ID, BAND_OWNER_ID, BAND_LABEL_ID, [])).toBe(false)
    })
  })

  describe('LABEL role', () => {
    it('can submit promo for a band in their label roster', () => {
      expect(
        canSubmitPromo('LABEL', LABEL_USER_ID, BAND_OWNER_ID, BAND_LABEL_ID, [BAND_LABEL_ID]),
      ).toBe(true)
    })

    it('cannot submit promo for a band with no label assigned', () => {
      expect(
        canSubmitPromo('LABEL', LABEL_USER_ID, BAND_OWNER_ID, null, [BAND_LABEL_ID]),
      ).toBe(false)
    })

    it('cannot submit promo for a band from a different label', () => {
      expect(
        canSubmitPromo('LABEL', LABEL_USER_ID, BAND_OWNER_ID, 'other-label', [BAND_LABEL_ID]),
      ).toBe(false)
    })

    it('cannot submit if user has no label memberships', () => {
      expect(
        canSubmitPromo('LABEL', LABEL_USER_ID, BAND_OWNER_ID, BAND_LABEL_ID, []),
      ).toBe(false)
    })
  })

  describe('other roles', () => {
    it.each(['FAN', 'DJ', 'EDITOR', 'AR'] as const)(
      '%s role cannot submit promo',
      (role) => {
        expect(canSubmitPromo(role, OTHER_USER_ID, BAND_OWNER_ID, null, [])).toBe(false)
      },
    )
  })

  describe('PROMO_ALLOWED_ROLES', () => {
    it('includes BAND, LABEL, and ADMIN', () => {
      expect(PROMO_ALLOWED_ROLES).toContain('BAND')
      expect(PROMO_ALLOWED_ROLES).toContain('LABEL')
      expect(PROMO_ALLOWED_ROLES).toContain('ADMIN')
    })

    it('excludes FAN and DJ', () => {
      expect(PROMO_ALLOWED_ROLES).not.toContain('FAN')
      expect(PROMO_ALLOWED_ROLES).not.toContain('DJ')
    })
  })
})
