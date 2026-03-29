import { describe, it, expect, vi } from 'vitest'
import { sendTrialExpirationReminder } from '@/infrastructure/payment/trialNotification'
import { TRIAL_WARNING_DAYS } from '@/domain/payment/trialConfig'

describe('sendTrialExpirationReminder', () => {
  it('succeeds when email is provided and trial is in warning phase', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const result = await sendTrialExpirationReminder({
      bandId: 'band-123',
      email: 'test@example.com',
      daysRemaining: 5,
      trialEndDate: '2026-04-05T00:00:00Z',
    })
    expect(result.success).toBe(true)
    expect(result.message).toContain('5 day(s) remaining')
    consoleSpy.mockRestore()
  })

  it('fails when no email is provided', async () => {
    const result = await sendTrialExpirationReminder({
      bandId: 'band-123',
      email: '',
      daysRemaining: 5,
      trialEndDate: '2026-04-05T00:00:00Z',
    })
    expect(result.success).toBe(false)
    expect(result.message).toContain('No email address')
  })

  it('fails when trial is not yet in warning phase', async () => {
    const result = await sendTrialExpirationReminder({
      bandId: 'band-123',
      email: 'test@example.com',
      daysRemaining: TRIAL_WARNING_DAYS + 1,
      trialEndDate: '2026-04-28T00:00:00Z',
    })
    expect(result.success).toBe(false)
    expect(result.message).toContain('not yet in warning phase')
  })

  it('succeeds at the boundary of the warning threshold', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const result = await sendTrialExpirationReminder({
      bandId: 'band-123',
      email: 'test@example.com',
      daysRemaining: TRIAL_WARNING_DAYS,
      trialEndDate: '2026-04-05T00:00:00Z',
    })
    expect(result.success).toBe(true)
    consoleSpy.mockRestore()
  })
})
