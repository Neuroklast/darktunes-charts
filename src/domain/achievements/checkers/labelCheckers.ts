/**
 * Label Achievement Checkers
 *
 * Pure, deterministic functions that evaluate whether a label user has met
 * the criteria for specific label-role achievements.
 */

import type { LabelAchievementContext } from '../engine'
import type { AchievementDefinition } from '../index'

export type LabelChecker = (ctx: LabelAchievementContext, def: AchievementDefinition) => boolean

/**
 * A&R Vanguard — Label has 3+ signed artists in velocity top 10
 */
export const ar_vanguard: LabelChecker = (c) => c.signedsInVelocityTop10 >= 3

/**
 * Newcomer Engine — Label brought 1+ act into tier 1 or 2
 */
export const newcomer_engine: LabelChecker = (c) => c.tier1or2EntryCount >= 1

/**
 * Efficiency Pro — Label has perfect success-to-roster ratio
 */
export const efficiency_pro: LabelChecker = (c) => c.successToRosterRatio === 1

/**
 * Transparent Partner — Label has clean mandates (requires KYC)
 */
export const transparent_partner: LabelChecker = (c, def) => {
  if (def.requiresKyc && !c.kycApproved) return false
  return c.allMandatesClean
}

/**
 * Scene Catalyst — Label supported best-rated party
 */
export const scene_catalyst: LabelChecker = (c) => c.bestPartySupported

/**
 * Territory Lead — Label has 5+ international chart entries
 */
export const territory_lead: LabelChecker = (c) => c.internationalChartEntries >= 5

/**
 * Market Mover — Label has highest super listener activity rank
 */
export const market_mover: LabelChecker = (c) => c.superListenerActivityRank === 1

/**
 * Sustainability Star — Label kept 5+ acts in top 100 over a year
 */
export const sustainability_star: LabelChecker = (c) => c.actsInTop100OverYear >= 5

/**
 * B2B Networker — Label manages 10+ mandated bands (requires KYC)
 */
export const b2b_networker: LabelChecker = (c, def) => {
  if (def.requiresKyc && !c.kycApproved) return false
  return c.mandatedBandCount >= 10
}

/**
 * Industrial Excellence — Label has #1 DaaS rating (requires KYC)
 */
export const industrial_excellence: LabelChecker = (c, def) => {
  if (def.requiresKyc && !c.kycApproved) return false
  return c.daasRatingRank === 1
}
