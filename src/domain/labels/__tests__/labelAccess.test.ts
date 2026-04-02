import { describe, it, expect } from 'vitest'
import { isLabelAdmin } from '../index'
import type { LabelMemberRecord } from '../index'

describe('isLabelAdmin', () => {
  const LABEL_ID = 'label-001'
  const OTHER_LABEL_ID = 'label-002'
  const ADMIN_USER_ID = 'user-admin'
  const MEMBER_USER_ID = 'user-member'

  const memberships: LabelMemberRecord[] = [
    {
      id: 'm1',
      labelId: LABEL_ID,
      userId: ADMIN_USER_ID,
      role: 'ADMIN',
      createdAt: new Date('2026-01-01'),
    },
    {
      id: 'm2',
      labelId: LABEL_ID,
      userId: MEMBER_USER_ID,
      role: 'MEMBER',
      createdAt: new Date('2026-01-01'),
    },
  ]

  it('returns true for an ADMIN member of the label', () => {
    expect(isLabelAdmin(ADMIN_USER_ID, LABEL_ID, memberships)).toBe(true)
  })

  it('returns false for a MEMBER (non-admin) of the label', () => {
    expect(isLabelAdmin(MEMBER_USER_ID, LABEL_ID, memberships)).toBe(false)
  })

  it('returns false for a user not in the label', () => {
    expect(isLabelAdmin('unknown-user', LABEL_ID, memberships)).toBe(false)
  })

  it('returns false when checking a different label', () => {
    expect(isLabelAdmin(ADMIN_USER_ID, OTHER_LABEL_ID, memberships)).toBe(false)
  })

  it('returns false with empty memberships list', () => {
    expect(isLabelAdmin(ADMIN_USER_ID, LABEL_ID, [])).toBe(false)
  })
})
