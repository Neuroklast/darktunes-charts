import { describe, it, expect } from 'vitest'
import {
  validatePromoSubmission,
  validatePromoFeedback,
  isPromoSubmitter,
  MAX_PROMO_ASSETS,
  MAX_FEEDBACK_NOTE_LENGTH,
} from '../index'

// ─── validatePromoSubmission ──────────────────────────────────────────────────

describe('validatePromoSubmission', () => {
  it('accepts a valid band submission', () => {
    const data = { bandId: '11111111-1111-1111-1111-111111111111' }
    const result = validatePromoSubmission(data)
    expect(result.bandId).toBe(data.bandId)
  })

  it('accepts a valid label submission', () => {
    const data = { labelId: '22222222-2222-2222-2222-222222222222' }
    const result = validatePromoSubmission(data)
    expect(result.labelId).toBe(data.labelId)
  })

  it('accepts a submission with releaseId', () => {
    const data = {
      bandId: '11111111-1111-1111-1111-111111111111',
      releaseId: '33333333-3333-3333-3333-333333333333',
    }
    const result = validatePromoSubmission(data)
    expect(result.releaseId).toBe(data.releaseId)
  })

  it('rejects submission with neither bandId nor labelId', () => {
    expect(() => validatePromoSubmission({})).toThrow(/bandId|labelId/i)
  })

  it('rejects submission with invalid UUID', () => {
    expect(() => validatePromoSubmission({ bandId: 'not-a-uuid' })).toThrow()
  })

  it('rejects submission with too many assets', () => {
    const assets = Array.from({ length: MAX_PROMO_ASSETS + 1 }, (_, i) => ({
      type: 'audio_preview' as const,
      url: `https://example.com/file${i}.mp3`,
    }))
    expect(() =>
      validatePromoSubmission({ bandId: '11111111-1111-1111-1111-111111111111', assets }),
    ).toThrow()
  })

  it('accepts assets within limit', () => {
    const assets = [
      { type: 'audio_preview' as const, url: 'https://example.com/preview.mp3' },
      { type: 'cover_art' as const, url: 'https://example.com/cover.jpg' },
    ]
    const result = validatePromoSubmission({
      bandId: '11111111-1111-1111-1111-111111111111',
      assets,
    })
    expect(result.assets).toHaveLength(2)
  })

  it('rejects assets with invalid URL', () => {
    expect(() =>
      validatePromoSubmission({
        bandId: '11111111-1111-1111-1111-111111111111',
        assets: [{ type: 'audio_preview', url: 'not-a-url' }],
      }),
    ).toThrow()
  })
})

// ─── validatePromoFeedback ────────────────────────────────────────────────────

describe('validatePromoFeedback', () => {
  it('accepts valid PLAYED decision', () => {
    const result = validatePromoFeedback({ decision: 'PLAYED' })
    expect(result.decision).toBe('PLAYED')
  })

  it('accepts valid CONSIDERED decision with note', () => {
    const result = validatePromoFeedback({ decision: 'CONSIDERED', note: 'Good track, will consider for set' })
    expect(result.decision).toBe('CONSIDERED')
    expect(result.note).toBe('Good track, will consider for set')
  })

  it('accepts valid PASS decision', () => {
    const result = validatePromoFeedback({ decision: 'PASS' })
    expect(result.decision).toBe('PASS')
  })

  it('rejects invalid decision value', () => {
    expect(() => validatePromoFeedback({ decision: 'LOVED' })).toThrow()
  })

  it('rejects note that exceeds max length', () => {
    const longNote = 'x'.repeat(MAX_FEEDBACK_NOTE_LENGTH + 1)
    expect(() => validatePromoFeedback({ decision: 'PASS', note: longNote })).toThrow()
  })

  it('accepts note at max length', () => {
    const note = 'x'.repeat(MAX_FEEDBACK_NOTE_LENGTH)
    const result = validatePromoFeedback({ decision: 'PLAYED', note })
    expect(result.note).toHaveLength(MAX_FEEDBACK_NOTE_LENGTH)
  })

  it('rejects missing decision field', () => {
    expect(() => validatePromoFeedback({})).toThrow()
  })

  it('PROMO INVARIANT: feedback has no chart score or vote fields (ADR-018)', () => {
    const result = validatePromoFeedback({ decision: 'PLAYED' })
    expect(result).not.toHaveProperty('chartScore')
    expect(result).not.toHaveProperty('voteWeight')
    expect(result).not.toHaveProperty('djBallot')
  })
})

// ─── isPromoSubmitter ─────────────────────────────────────────────────────────

describe('isPromoSubmitter', () => {
  const BAND_ID = 'band-111'
  const LABEL_ID = 'label-222'
  const USER_ID = 'user-333'

  it('returns true when band matches', () => {
    const submission = { bandId: BAND_ID, labelId: undefined }
    expect(isPromoSubmitter(submission, USER_ID, BAND_ID)).toBe(true)
  })

  it('returns true when label matches', () => {
    const submission = { bandId: undefined, labelId: LABEL_ID }
    expect(isPromoSubmitter(submission, USER_ID, undefined, LABEL_ID)).toBe(true)
  })

  it('returns false when neither band nor label matches', () => {
    const submission = { bandId: 'other-band', labelId: undefined }
    expect(isPromoSubmitter(submission, USER_ID, BAND_ID)).toBe(false)
  })

  it('returns false when submission has no owner', () => {
    const submission = { bandId: undefined, labelId: undefined }
    expect(isPromoSubmitter(submission, USER_ID)).toBe(false)
  })
})
