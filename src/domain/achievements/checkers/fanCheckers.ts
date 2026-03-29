/**
 * Fan Achievement Checkers
 *
 * Pure, deterministic functions that evaluate whether a fan user has met
 * the criteria for specific fan-role achievements.
 */

import type { FanAchievementContext } from '../engine'
import type { AchievementDefinition } from '../index'

export type FanChecker = (ctx: FanAchievementContext, def: AchievementDefinition) => boolean

/**
 * Early Signal — Fan voted for tracks before they hit top 20
 */
export const early_signal: FanChecker = (c) => c.votedTop20Before.length > 0

/**
 * True Believer — Fan spent entire budget on a single track
 */
export const true_believer: FanChecker = (c) => c.budgetFullOnSingleTrack

/**
 * Genre Nomad — Fan voted for 5+ distinct sub-genres in one cycle
 */
export const genre_nomad: FanChecker = (c) => c.subGenresThisCycle >= 5

/**
 * Verified Human — Fan passed bot detection for 6+ consecutive cycles
 */
export const verified_human: FanChecker = (c, def) => {
  if (def.requiresKyc && !c.anomalyPassed) return false
  return c.cyclesWithoutBotFlag >= 6
}

/**
 * Scene Veteran — Fan participated in 12+ voting cycles
 */
export const scene_veteran: FanChecker = (c) => c.totalVotingCycles >= 12

/**
 * Alpha Listener — Fan cast 1st vote on a track that later became #1
 */
export const alpha_listener: FanChecker = (c) => c.alpha1stVotesOnTop1

/**
 * Trend Scout — Fan's votes correlate 0.75+ with next month's charts
 */
export const trend_scout: FanChecker = (c) => c.predictiveCorrelation >= 0.75

/**
 * Loyalty Core — Fan voted 3+ consecutive months
 */
export const loyalty_core: FanChecker = (c) => c.loyaltyStreakMonths >= 3

/**
 * Vibe Curator — Fan rated 10+ events in a month
 */
export const vibe_curator: FanChecker = (c) => c.eventsRatedThisMonth >= 10

/**
 * Data Contributor — Fan has 100% profile completion + 3+ streaming platforms linked
 */
export const data_contributor: FanChecker = (c) => {
  return c.profileCompletenessPercent >= 100 && c.streamingPlatformsLinked >= 3
}

/**
 * Discovery Engine — Fan voted for 10+ tracks with <1k listeners
 */
export const discovery_engine: FanChecker = (c) => c.tracksUnder1kListeners >= 10

/**
 * Quality Advocate — Fan has 90%+ validation vote ratio
 */
export const quality_advocate: FanChecker = (c) => c.highValidationVoteRatio >= 0.9

/**
 * Local Hero — Fan's votes are 70%+ from primary region
 */
export const local_hero: FanChecker = (c) => c.primaryRegionVoteRatio >= 0.7

/**
 * Bridge Builder — Fan voted for artists from 3+ different countries
 */
export const bridge_builder: FanChecker = (c) => c.countriesVotedThisCycle >= 3

/**
 * Founding Fan — Fan account created within first 12 months
 */
export const founding_fan: FanChecker = (c) => c.accountAgeMonths <= 12
