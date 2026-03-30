import { describe, it, expect } from 'vitest'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'

/**
 * i18n Completion Tests — validates that all new translation keys added
 * during the i18n completion epic (#83–#86) exist in both locale files
 * and have non-empty string values.
 */

/* ── Helper ─────────────────────────────────────────────────────────── */

function assertKeysExist(
  section: Record<string, unknown>,
  keys: readonly string[],
  locale: string,
  namespace: string,
) {
  for (const key of keys) {
    expect(section, `${locale} ${namespace} missing key "${key}"`).toHaveProperty(key)
    const value = section[key as keyof typeof section]
    expect(typeof value, `${locale} ${namespace}.${key} should be a string`).toBe('string')
    expect((value as string).length, `${locale} ${namespace}.${key} must not be empty`).toBeGreaterThan(0)
  }
}

/* ── #83: HelpButton / HelpPanel ────────────────────────────────────── */

describe('#83 — help namespace (HelpButton / HelpPanel)', () => {
  const REQUIRED_KEYS = ['defaultAriaLabel', 'closePanel'] as const

  it('de.json help contains all required keys', () => {
    assertKeysExist(deMessages.help, REQUIRED_KEYS, 'de', 'help')
  })

  it('en.json help contains all required keys', () => {
    assertKeysExist(enMessages.help, REQUIRED_KEYS, 'en', 'help')
  })

  it('de.json and en.json have the same help keys', () => {
    expect(Object.keys(deMessages.help).sort()).toEqual(Object.keys(enMessages.help).sort())
  })
})

/* ── #84: NavigationBar ─────────────────────────────────────────────── */

describe('#84 — navigation namespace additions (NavigationBar)', () => {
  const NEW_NAV_KEYS = ['openMenu', 'homeLink'] as const

  it('de.json navigation contains new keys', () => {
    assertKeysExist(deMessages.navigation, NEW_NAV_KEYS, 'de', 'navigation')
  })

  it('en.json navigation contains new keys', () => {
    assertKeysExist(enMessages.navigation, NEW_NAV_KEYS, 'en', 'navigation')
  })

  it('de.json and en.json have the same navigation keys', () => {
    expect(Object.keys(deMessages.navigation).sort()).toEqual(
      Object.keys(enMessages.navigation).sort(),
    )
  })
})

/* ── #85: ScoutingPanel ─────────────────────────────────────────────── */

describe('#85 — scouting namespace (ScoutingPanel)', () => {
  const REQUIRED_KEYS = [
    'title',
    'emptyState',
    'confidence',
    'nominate',
    'reasonNewRelease',
    'reasonVelocitySpike',
    'reasonGenreMatch',
  ] as const

  it('de.json scouting contains all required keys', () => {
    assertKeysExist(deMessages.scouting, REQUIRED_KEYS, 'de', 'scouting')
  })

  it('en.json scouting contains all required keys', () => {
    assertKeysExist(enMessages.scouting, REQUIRED_KEYS, 'en', 'scouting')
  })

  it('de.json and en.json have the same scouting keys', () => {
    expect(Object.keys(deMessages.scouting).sort()).toEqual(
      Object.keys(enMessages.scouting).sort(),
    )
  })
})

/* ── #86: FanVotingPanel ────────────────────────────────────────────── */

describe('#86 — voting.fanVote additions (FanVotingPanel)', () => {
  const NEW_KEYS = [
    'noTracks',
    'helpAriaLabel',
    'creditsRemaining',
    'budgetExceeded',
    'trackGroupAriaLabel',
    'saveDraftAriaLabel',
    'resetAriaLabel',
    'submitAriaLabel',
    'submitting',
    'confirmDescription',
    'confirmConfirm',
    'confirmCancel',
    'resetDescription',
    'resetConfirm',
    'resetCancel',
  ] as const

  it('de.json voting.fanVote contains all new keys', () => {
    assertKeysExist(deMessages.voting.fanVote, NEW_KEYS, 'de', 'voting.fanVote')
  })

  it('en.json voting.fanVote contains all new keys', () => {
    assertKeysExist(enMessages.voting.fanVote, NEW_KEYS, 'en', 'voting.fanVote')
  })

  it('de.json and en.json have the same voting.fanVote keys', () => {
    expect(Object.keys(deMessages.voting.fanVote).sort()).toEqual(
      Object.keys(enMessages.voting.fanVote).sort(),
    )
  })
})

/* ── #86: DJBallotDnD ───────────────────────────────────────────────── */

describe('#86 — voting.djVote additions (DJBallotDnD)', () => {
  const NEW_KEYS = [
    'noTracks',
    'dragInstruction',
    'helpAriaLabel',
    'dragAriaLabel',
    'albumArtAlt',
    'rankingAriaLabel',
    'saveDraftAriaLabel',
    'submitAriaLabel',
    'submitting',
    'confirmDescription',
    'confirmConfirm',
    'confirmCancel',
  ] as const

  it('de.json voting.djVote contains all new keys', () => {
    assertKeysExist(deMessages.voting.djVote, NEW_KEYS, 'de', 'voting.djVote')
  })

  it('en.json voting.djVote contains all new keys', () => {
    assertKeysExist(enMessages.voting.djVote, NEW_KEYS, 'en', 'voting.djVote')
  })

  it('de.json and en.json have the same voting.djVote keys', () => {
    expect(Object.keys(deMessages.voting.djVote).sort()).toEqual(
      Object.keys(enMessages.voting.djVote).sort(),
    )
  })
})

/* ── #86: TrackSubmissionForm ───────────────────────────────────────── */

describe('#86 — trackSubmission namespace (TrackSubmissionForm)', () => {
  const REQUIRED_KEYS = [
    'titleLabel',
    'titlePlaceholder',
    'genreLabel',
    'genreSelect',
    'isrcLabel',
    'isrcPlaceholder',
    'spotifyLabel',
    'spotifyPlaceholder',
    'submitting',
    'submit',
    'enriching',
    'success',
  ] as const

  it('de.json trackSubmission contains all required keys', () => {
    assertKeysExist(deMessages.trackSubmission, REQUIRED_KEYS, 'de', 'trackSubmission')
  })

  it('en.json trackSubmission contains all required keys', () => {
    assertKeysExist(enMessages.trackSubmission, REQUIRED_KEYS, 'en', 'trackSubmission')
  })

  it('de.json and en.json have the same trackSubmission keys', () => {
    expect(Object.keys(deMessages.trackSubmission).sort()).toEqual(
      Object.keys(enMessages.trackSubmission).sort(),
    )
  })
})

/* ── #86: DJFeedbackForm ────────────────────────────────────────────── */

describe('#86 — dashboard.dj.feedback additions (DJFeedbackForm)', () => {
  const NEW_KEYS = ['feedbackTo', 'characters', 'unknownError', 'sending'] as const

  it('de.json dashboard.dj.feedback contains new keys', () => {
    assertKeysExist(deMessages.dashboard.dj.feedback, NEW_KEYS, 'de', 'dashboard.dj.feedback')
  })

  it('en.json dashboard.dj.feedback contains new keys', () => {
    assertKeysExist(enMessages.dashboard.dj.feedback, NEW_KEYS, 'en', 'dashboard.dj.feedback')
  })

  it('de.json and en.json have the same dashboard.dj.feedback keys', () => {
    expect(Object.keys(deMessages.dashboard.dj.feedback).sort()).toEqual(
      Object.keys(enMessages.dashboard.dj.feedback).sort(),
    )
  })
})

/* ── #86: Label Dashboard ───────────────────────────────────────────── */

describe('#86 — dashboard.label additions (Label Dashboard)', () => {
  const NEW_KEYS = [
    'arAnalytics',
    'conversionRate',
    'conversionHelpAriaLabel',
    'conversionSubtext',
    'highQvConversion',
    'trendScouting',
    'trendHelpAriaLabel',
    'trending',
    'peerReview',
    'peerHelpAriaLabel',
    'peerDescription',
    'trendHelpTitle',
    'trendHelpDescription',
    'conversionHelpTitle',
    'conversionHelpDescription',
    'peerHelpTitle',
    'peerHelpDescription',
    'voteVelocityAriaLabel',
  ] as const

  it('de.json dashboard.label contains all new keys', () => {
    assertKeysExist(deMessages.dashboard.label, NEW_KEYS, 'de', 'dashboard.label')
  })

  it('en.json dashboard.label contains all new keys', () => {
    assertKeysExist(enMessages.dashboard.label, NEW_KEYS, 'en', 'dashboard.label')
  })

  it('de.json and en.json have the same dashboard.label keys', () => {
    expect(Object.keys(deMessages.dashboard.label).sort()).toEqual(
      Object.keys(enMessages.dashboard.label).sort(),
    )
  })
})

/* ── #86: Band Dashboard ────────────────────────────────────────────── */

describe('#86 — dashboard.band additions (Band Dashboard)', () => {
  const NEW_KEYS = [
    'followerRange',
    'combined',
    'superListenerHelpTitle',
    'superListenerHelpDescription',
    'superListenerHelpAriaLabel',
    'superListenerCriteria',
    'newComments',
    'voterStructure',
    'voterStructureHelpTitle',
    'voterStructureHelpDescription',
    'voterStructureHelpAriaLabel',
    'chartTrend',
    'chartTrendHelpTitle',
    'chartTrendHelpDescription',
    'chartTrendHelpAriaLabel',
    'noChartData',
    'registerPrompt',
    'votes',
  ] as const

  it('de.json dashboard.band contains all new keys', () => {
    assertKeysExist(deMessages.dashboard.band, NEW_KEYS, 'de', 'dashboard.band')
  })

  it('en.json dashboard.band contains all new keys', () => {
    assertKeysExist(enMessages.dashboard.band, NEW_KEYS, 'en', 'dashboard.band')
  })

  it('de.json and en.json have the same dashboard.band keys', () => {
    expect(Object.keys(deMessages.dashboard.band).sort()).toEqual(
      Object.keys(enMessages.dashboard.band).sort(),
    )
  })
})

/* ── #86: DJ Dashboard ──────────────────────────────────────────────── */

describe('#86 — dashboard.dj additions (DJ Dashboard)', () => {
  const NEW_KEYS = [
    'submitBallotLink',
    'scoreDescription',
    'thisMonth',
    'vsFinalResult',
    'noBallots',
  ] as const

  it('de.json dashboard.dj contains all new keys', () => {
    assertKeysExist(
      deMessages.dashboard.dj as unknown as Record<string, unknown>,
      NEW_KEYS,
      'de',
      'dashboard.dj',
    )
  })

  it('en.json dashboard.dj contains all new keys', () => {
    assertKeysExist(
      enMessages.dashboard.dj as unknown as Record<string, unknown>,
      NEW_KEYS,
      'en',
      'dashboard.dj',
    )
  })
})

/* ── Cross-locale consistency ───────────────────────────────────────── */

describe('Cross-locale key consistency (full file)', () => {
  it('top-level keys are identical', () => {
    expect(Object.keys(deMessages).sort()).toEqual(Object.keys(enMessages).sort())
  })
})
