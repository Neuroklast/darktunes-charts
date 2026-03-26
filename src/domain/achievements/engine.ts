/**
 * Achievement Granting Engine
 *
 * Pure, side-effect-free checkers that evaluate whether a user has met
 * the criteria for a specific achievement. The engine is called by the
 * Vercel Cron Job (/api/cron/achievement-check) and must never block
 * the request path.
 *
 * Architecture:
 *   - Each checker is a deterministic function: (context) → boolean
 *   - The orchestrator loops all definitions, runs the relevant checker,
 *     and returns the slugs that should be granted
 *   - Actual DB writes happen in the API route, not here
 *
 * Integrity badges (Verified Human, Legacy Curator, etc.) are guarded
 * by an additional `anomalyPassed` flag that must be set by the
 * AI-anomaly-detection layer before the engine runs.
 */

import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition } from './index'

// ─── Context shapes passed to the engine ─────────────────────────────────────

export interface FanAchievementContext {
  userId: string
  role: 'FAN'
  anomalyPassed: boolean          // bot-detection cleared
  totalVotingCycles: number       // consecutive months voted
  cyclesWithoutBotFlag: number
  subGenresThisCycle: number      // distinct genres voted this cycle
  budgetFullOnSingleTrack: boolean
  votedTop20Before: string[]      // trackIds voted before they hit top 20
  alpha1stVotesOnTop1: boolean
  predictiveCorrelation: number   // 0–1
  loyaltyStreakMonths: number
  eventsRatedThisMonth: number
  profileCompletenessPercent: number
  streamingPlatformsLinked: number
  tracksUnder1kListeners: number
  highValidationVoteRatio: number // 0–1
  primaryRegionVoteRatio: number  // 0–1
  countriesVotedThisCycle: number
  accountAgeMonths: number
}

export interface BandAchievementContext {
  userId: string
  role: 'BAND'
  peerRank1: boolean
  superListenerDensityRank: number
  genreChartCount: number
  reciprocityPenaltyRate: number
  smlGrowthRank: number           // 1 = highest growth
  hasLabelAssociation: boolean
  topCombinedRank: number
  djGenreRank1: boolean
  votingCountryCount: number
  monthsInTop50: number
  eventIntentRank: number
  metadataEngagementHigh: boolean
  outsideLabelVotes: number
  tier: 'MICRO' | 'EMERGING' | 'ESTABLISHED' | 'INTERNATIONAL' | 'MACRO'
  professionalValidationRank: number
  featuredArtistCount: number
  combinedRank1: boolean
}

export interface DJAchievementContext {
  userId: string
  role: 'DJ'
  anomalyPassed: boolean
  schulzeCorrelation: number      // 0–1 match with next month's fan charts
  highQualityFeedbackCount: number
  participationMonths: number
  hasVerifiedVenueResidency: boolean
  rankedClubStandardTrackFirst: boolean
  fullSchulzeGenreCount: number
  usefulFeedbackFromArtists: number
  spotifySaveConversionRank: number
  expertGenreCount: number
  sceneYears: number              // KYC verified
  kycApproved: boolean
}

export interface LabelAchievementContext {
  userId: string
  role: 'LABEL'
  kycApproved: boolean
  signedsInVelocityTop10: number
  tier1or2EntryCount: number
  successToRosterRatio: number   // rank: 1 = best
  allMandatesClean: boolean
  bestPartySupported: boolean
  internationalChartEntries: number
  superListenerActivityRank: number
  actsInTop100OverYear: number
  mandatedBandCount: number
  daasRatingRank: number
}

export type AchievementContext =
  | FanAchievementContext
  | BandAchievementContext
  | DJAchievementContext
  | LabelAchievementContext

// ─── Individual checkers ──────────────────────────────────────────────────────

type Checker = (ctx: AchievementContext, def: AchievementDefinition) => boolean

const CHECKERS: Record<string, Checker> = {

  // FAN
  early_signal:       (c) => (c as FanAchievementContext).votedTop20Before.length > 0,
  true_believer:      (c) => (c as FanAchievementContext).budgetFullOnSingleTrack,
  genre_nomad:        (c) => (c as FanAchievementContext).subGenresThisCycle >= 5,
  verified_human:     (c, def) => {
    const ctx = c as FanAchievementContext
    if (def.requiresKyc && !ctx.anomalyPassed) return false
    return ctx.cyclesWithoutBotFlag >= 6
  },
  scene_veteran:      (c) => (c as FanAchievementContext).totalVotingCycles >= 12,
  alpha_listener:     (c) => (c as FanAchievementContext).alpha1stVotesOnTop1,
  trend_scout:        (c) => (c as FanAchievementContext).predictiveCorrelation >= 0.75,
  loyalty_core:       (c) => (c as FanAchievementContext).loyaltyStreakMonths >= 3,
  vibe_curator:       (c) => (c as FanAchievementContext).eventsRatedThisMonth >= 10,
  data_contributor:   (c) => {
    const ctx = c as FanAchievementContext
    return ctx.profileCompletenessPercent >= 100 && ctx.streamingPlatformsLinked >= 3
  },
  discovery_engine:   (c) => (c as FanAchievementContext).tracksUnder1kListeners >= 10,
  quality_advocate:   (c) => (c as FanAchievementContext).highValidationVoteRatio >= 0.9,
  local_hero:         (c) => (c as FanAchievementContext).primaryRegionVoteRatio >= 0.7,
  bridge_builder:     (c) => (c as FanAchievementContext).countriesVotedThisCycle >= 3,
  founding_fan:       (c) => (c as FanAchievementContext).accountAgeMonths <= 12,

  // BAND
  musicians_choice:   (c) => (c as BandAchievementContext).peerRank1,
  high_intensity_core:(c) => (c as BandAchievementContext).superListenerDensityRank === 1,
  genre_bender:       (c) => (c as BandAchievementContext).genreChartCount >= 3,
  honest_player:      (c) => (c as BandAchievementContext).reciprocityPenaltyRate === 0,
  velocity_star:      (c) => (c as BandAchievementContext).smlGrowthRank === 1,
  independent_power:  (c) => {
    const ctx = c as BandAchievementContext
    return !ctx.hasLabelAssociation && ctx.topCombinedRank <= 10
  },
  club_standard:      (c) => (c as BandAchievementContext).djGenreRank1,
  global_resonance:   (c) => (c as BandAchievementContext).votingCountryCount >= 20,
  consistent_edge:    (c) => (c as BandAchievementContext).monthsInTop50 >= 6,
  crowd_magnet:       (c) => (c as BandAchievementContext).eventIntentRank === 1,
  visual_identity:    (c) => (c as BandAchievementContext).metadataEngagementHigh,
  scene_respect:      (c) => (c as BandAchievementContext).outsideLabelVotes > 0,
  underground_king:   (c) => {
    const ctx = c as BandAchievementContext
    return ctx.tier === 'MICRO' && ctx.professionalValidationRank === 1
  },
  collaboration_pro:  (c) => (c as BandAchievementContext).featuredArtistCount >= 2,
  combined_champion:  (c) => (c as BandAchievementContext).combinedRank1,

  // DJ
  predictive_authority:(c) => (c as DJAchievementContext).schulzeCorrelation >= 0.8,
  technical_critic:    (c) => (c as DJAchievementContext).highQualityFeedbackCount >= 20,
  reliable_curator:    (c) => (c as DJAchievementContext).participationMonths >= 12,
  venue_pillar:        (c, def) => {
    const ctx = c as DJAchievementContext
    if (def.requiresKyc && !ctx.kycApproved) return false
    return ctx.hasVerifiedVenueResidency
  },
  first_responder:     (c) => (c as DJAchievementContext).rankedClubStandardTrackFirst,
  master_of_paths:     (c) => (c as DJAchievementContext).fullSchulzeGenreCount >= 5,
  industry_insider:    (c) => (c as DJAchievementContext).usefulFeedbackFromArtists >= 10,
  floor_filler:        (c) => (c as DJAchievementContext).spotifySaveConversionRank === 1,
  diverse_ear:         (c) => (c as DJAchievementContext).expertGenreCount >= 3,
  legacy_curator:      (c, def) => {
    const ctx = c as DJAchievementContext
    if (def.requiresKyc && !ctx.kycApproved) return false
    return ctx.sceneYears >= 10
  },

  // LABEL
  ar_vanguard:         (c) => (c as LabelAchievementContext).signedsInVelocityTop10 >= 3,
  newcomer_engine:     (c) => (c as LabelAchievementContext).tier1or2EntryCount >= 1,
  efficiency_pro:      (c) => (c as LabelAchievementContext).successToRosterRatio === 1,
  transparent_partner: (c, def) => {
    const ctx = c as LabelAchievementContext
    if (def.requiresKyc && !ctx.kycApproved) return false
    return ctx.allMandatesClean
  },
  scene_catalyst:      (c) => (c as LabelAchievementContext).bestPartySupported,
  territory_lead:      (c) => (c as LabelAchievementContext).internationalChartEntries >= 5,
  market_mover:        (c) => (c as LabelAchievementContext).superListenerActivityRank === 1,
  sustainability_star: (c) => (c as LabelAchievementContext).actsInTop100OverYear >= 5,
  b2b_networker:       (c, def) => {
    const ctx = c as LabelAchievementContext
    if (def.requiresKyc && !ctx.kycApproved) return false
    return ctx.mandatedBandCount >= 10
  },
  industrial_excellence:(c, def) => {
    const ctx = c as LabelAchievementContext
    if (def.requiresKyc && !ctx.kycApproved) return false
    return ctx.daasRatingRank === 1
  },
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface GrantResult {
  /** Slugs of achievements that should now be granted. */
  toGrant: string[]
  /** Slugs that could not be evaluated (missing checker). */
  skipped: string[]
}

/**
 * Evaluate all achievement definitions against the provided context.
 *
 * @param ctx     - Role-specific context object with all relevant metrics
 * @param already - Set of slugs already granted to this user (skip re-grant)
 * @returns       - Slugs to grant + skipped slugs
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  already: Set<string>
): GrantResult {
  const toGrant: string[] = []
  const skipped: string[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    // Skip already-granted
    if (already.has(def.slug)) continue

    const checker = CHECKERS[def.slug]
    if (!checker) {
      skipped.push(def.slug)
      continue
    }

    try {
      if (checker(ctx, def)) {
        toGrant.push(def.slug)
      }
    } catch {
      skipped.push(def.slug)
    }
  }

  return { toGrant, skipped }
}
