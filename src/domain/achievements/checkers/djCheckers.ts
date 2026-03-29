/**
 * DJ Achievement Checkers
 *
 * Pure, deterministic functions that evaluate whether a DJ user has met
 * the criteria for specific DJ-role achievements.
 */

import type { DJAchievementContext } from '../engine'
import type { AchievementDefinition } from '../index'

export type DJChecker = (ctx: DJAchievementContext, def: AchievementDefinition) => boolean

/**
 * Predictive Authority — DJ's Schulze ballots correlate 0.8+ with next month's fan charts
 */
export const predictive_authority: DJChecker = (c) => c.schulzeCorrelation >= 0.8

/**
 * Technical Critic — DJ provided 20+ high-quality feedback entries
 */
export const technical_critic: DJChecker = (c) => c.highQualityFeedbackCount >= 20

/**
 * Reliable Curator — DJ participated for 12+ months
 */
export const reliable_curator: DJChecker = (c) => c.participationMonths >= 12

/**
 * Venue Pillar — DJ has verified venue residency (requires KYC)
 */
export const venue_pillar: DJChecker = (c, def) => {
  if (def.requiresKyc && !c.kycApproved) return false
  return c.hasVerifiedVenueResidency
}

/**
 * First Responder — DJ ranked club standard track first
 */
export const first_responder: DJChecker = (c) => c.rankedClubStandardTrackFirst

/**
 * Master of Paths — DJ submitted complete Schulze ballots for 5+ genres
 */
export const master_of_paths: DJChecker = (c) => c.fullSchulzeGenreCount >= 5

/**
 * Industry Insider — DJ received 10+ useful feedback acknowledgments from artists
 */
export const industry_insider: DJChecker = (c) => c.usefulFeedbackFromArtists >= 10

/**
 * Floor Filler — DJ has highest Spotify save conversion rank
 */
export const floor_filler: DJChecker = (c) => c.spotifySaveConversionRank === 1

/**
 * Diverse Ear — DJ demonstrates expertise in 3+ genres
 */
export const diverse_ear: DJChecker = (c) => c.expertGenreCount >= 3

/**
 * Legacy Curator — DJ has 10+ years of scene experience (requires KYC)
 */
export const legacy_curator: DJChecker = (c, def) => {
  if (def.requiresKyc && !c.kycApproved) return false
  return c.sceneYears >= 10
}
