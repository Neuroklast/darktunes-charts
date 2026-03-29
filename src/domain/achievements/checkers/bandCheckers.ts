/**
 * Band Achievement Checkers
 *
 * Pure, deterministic functions that evaluate whether a band user has met
 * the criteria for specific band-role achievements.
 */

import type { BandAchievementContext } from '../engine'

export type BandChecker = (ctx: BandAchievementContext) => boolean

/**
 * Musician's Choice — Band ranked #1 in peer voting
 */
export const musicians_choice: BandChecker = (c) => c.peerRank1

/**
 * High Intensity Core — Band has highest super listener density
 */
export const high_intensity_core: BandChecker = (c) => c.superListenerDensityRank === 1

/**
 * Genre Bender — Band charted in 3+ different genre categories
 */
export const genre_bender: BandChecker = (c) => c.genreChartCount >= 3

/**
 * Honest Player — Band has zero reciprocity penalty
 */
export const honest_player: BandChecker = (c) => c.reciprocityPenaltyRate === 0

/**
 * Velocity Star — Band has highest monthly listener growth
 */
export const velocity_star: BandChecker = (c) => c.smlGrowthRank === 1

/**
 * Independent Power — Band reached top 10 without label association
 */
export const independent_power: BandChecker = (c) => {
  return !c.hasLabelAssociation && c.topCombinedRank <= 10
}

/**
 * Club Standard — Band ranked #1 in DJ genre voting
 */
export const club_standard: BandChecker = (c) => c.djGenreRank1

/**
 * Global Resonance — Band received votes from 20+ countries
 */
export const global_resonance: BandChecker = (c) => c.votingCountryCount >= 20

/**
 * Consistent Edge — Band stayed in top 50 for 6+ months
 */
export const consistent_edge: BandChecker = (c) => c.monthsInTop50 >= 6

/**
 * Crowd Magnet — Band has highest event intent ranking
 */
export const crowd_magnet: BandChecker = (c) => c.eventIntentRank === 1

/**
 * Visual Identity — Band has high metadata engagement
 */
export const visual_identity: BandChecker = (c) => c.metadataEngagementHigh

/**
 * Scene Respect — Band received votes from outside their label
 */
export const scene_respect: BandChecker = (c) => c.outsideLabelVotes > 0

/**
 * Underground King — Micro-tier band with highest professional validation
 */
export const underground_king: BandChecker = (c) => {
  return c.tier === 'MICRO' && c.professionalValidationRank === 1
}

/**
 * Collaboration Pro — Band featured 2+ other artists
 */
export const collaboration_pro: BandChecker = (c) => c.featuredArtistCount >= 2

/**
 * Combined Champion — Band ranked #1 in combined charts
 */
export const combined_champion: BandChecker = (c) => c.combinedRank1
