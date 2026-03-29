/**
 * Achievement Granting Engine
 *
 * Pure, side-effect-free orchestrator that evaluates whether a user has met
 * the criteria for specific achievements. The engine is called by the
 * Vercel Cron Job (/api/cron/achievement-check) and must never block
 * the request path.
 *
 * Architecture:
 *   - Each checker is a deterministic function: (context) → boolean
 *   - Checkers are organized by role in separate modules
 *   - The orchestrator loops all definitions, runs the relevant checker,
 *     and returns the slugs that should be granted
 *   - Actual DB writes happen in the API route, not here
 *
 * Integrity badges (Verified Human, Legacy Curator, etc.) are guarded
 * by an additional `anomalyPassed` flag that must be set by the
 * AI-anomaly-detection layer before the engine runs.
 */

import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition } from './index'
import * as fanCheckers from './checkers/fanCheckers'
import * as bandCheckers from './checkers/bandCheckers'
import * as djCheckers from './checkers/djCheckers'
import * as labelCheckers from './checkers/labelCheckers'

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

// ─── Checker Registry ─────────────────────────────────────────────────────────

type Checker = (ctx: AchievementContext, def: AchievementDefinition) => boolean

/**
 * Central registry mapping achievement slugs to their checker functions.
 * All checkers are imported from role-specific modules for better organization.
 */
const CHECKERS: Record<string, Checker> = {
  // FAN CHECKERS
  early_signal: fanCheckers.early_signal as Checker,
  true_believer: fanCheckers.true_believer as Checker,
  genre_nomad: fanCheckers.genre_nomad as Checker,
  verified_human: fanCheckers.verified_human as Checker,
  scene_veteran: fanCheckers.scene_veteran as Checker,
  alpha_listener: fanCheckers.alpha_listener as Checker,
  trend_scout: fanCheckers.trend_scout as Checker,
  loyalty_core: fanCheckers.loyalty_core as Checker,
  vibe_curator: fanCheckers.vibe_curator as Checker,
  data_contributor: fanCheckers.data_contributor as Checker,
  discovery_engine: fanCheckers.discovery_engine as Checker,
  quality_advocate: fanCheckers.quality_advocate as Checker,
  local_hero: fanCheckers.local_hero as Checker,
  bridge_builder: fanCheckers.bridge_builder as Checker,
  founding_fan: fanCheckers.founding_fan as Checker,

  // BAND CHECKERS
  musicians_choice: bandCheckers.musicians_choice as Checker,
  high_intensity_core: bandCheckers.high_intensity_core as Checker,
  genre_bender: bandCheckers.genre_bender as Checker,
  honest_player: bandCheckers.honest_player as Checker,
  velocity_star: bandCheckers.velocity_star as Checker,
  independent_power: bandCheckers.independent_power as Checker,
  club_standard: bandCheckers.club_standard as Checker,
  global_resonance: bandCheckers.global_resonance as Checker,
  consistent_edge: bandCheckers.consistent_edge as Checker,
  crowd_magnet: bandCheckers.crowd_magnet as Checker,
  visual_identity: bandCheckers.visual_identity as Checker,
  scene_respect: bandCheckers.scene_respect as Checker,
  underground_king: bandCheckers.underground_king as Checker,
  collaboration_pro: bandCheckers.collaboration_pro as Checker,
  combined_champion: bandCheckers.combined_champion as Checker,

  // DJ CHECKERS
  predictive_authority: djCheckers.predictive_authority as Checker,
  technical_critic: djCheckers.technical_critic as Checker,
  reliable_curator: djCheckers.reliable_curator as Checker,
  venue_pillar: djCheckers.venue_pillar as Checker,
  first_responder: djCheckers.first_responder as Checker,
  master_of_paths: djCheckers.master_of_paths as Checker,
  industry_insider: djCheckers.industry_insider as Checker,
  floor_filler: djCheckers.floor_filler as Checker,
  diverse_ear: djCheckers.diverse_ear as Checker,
  legacy_curator: djCheckers.legacy_curator as Checker,

  // LABEL CHECKERS
  ar_vanguard: labelCheckers.ar_vanguard as Checker,
  newcomer_engine: labelCheckers.newcomer_engine as Checker,
  efficiency_pro: labelCheckers.efficiency_pro as Checker,
  transparent_partner: labelCheckers.transparent_partner as Checker,
  scene_catalyst: labelCheckers.scene_catalyst as Checker,
  territory_lead: labelCheckers.territory_lead as Checker,
  market_mover: labelCheckers.market_mover as Checker,
  sustainability_star: labelCheckers.sustainability_star as Checker,
  b2b_networker: labelCheckers.b2b_networker as Checker,
  industrial_excellence: labelCheckers.industrial_excellence as Checker,
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
