/**
 * @module domain/charts/computation
 *
 * Chart computation engine for the darkTunes 2-pillar voting system.
 *
 * Orchestrates fan quadratic votes + DJ Schulze ballots per category,
 * applies temporal decay, checks quorum, and returns ranked results
 * with full transparency metadata for every computation step.
 *
 * Architecture note:
 *   This module is pure domain logic — it accepts raw vote/ballot data
 *   and returns structured results. Database reads/writes happen in the
 *   application layer (API route handlers).
 */

import { calculateSchulzeMethod } from '@/domain/voting/schulze'
import { minMaxNormalize, resolveWeights } from '@/domain/voting/combined'
import { evaluateQuorum } from '@/domain/voting/quorum'
import { calculateTemporalWeight } from '@/domain/voting/temporalDecay'
import { CATEGORY_DEFINITIONS, getChartEligibleCategories } from '@/domain/categories'
import type { AllCategory } from '@/lib/types'

// ─── Input types ─────────────────────────────────────────────────────────────

/** A single fan vote as fetched from the database. */
export interface FanVoteInput {
  userId: string
  releaseId: string
  votes: number
  creditsSpent: number
  createdAt: Date
}

/** A single DJ ballot as fetched from the database. */
export interface DJBallotInput {
  djId: string
  /** Ordered array of releaseIds from best (index 0) to worst. */
  rankings: string[]
  createdAt: Date
}

/** Release metadata needed to compute temporal decay. */
export interface ReleaseInput {
  id: string
  releaseDate: Date
  title: string
  bandName: string
}

// ─── Output types ─────────────────────────────────────────────────────────────

/** Fully transparent chart entry — one per ranked release. */
export interface ChartEntry {
  rank: number
  releaseId: string
  releaseTitle: string
  bandName: string
  scores: {
    fanScore: number
    djScore: number
    combined: number
    appliedWeights: { fan: number; dj: number }
  }
  metadata: {
    totalFanVotes: number
    totalDJBallots: number
    quorumMet: boolean
    quorumWarning?: string
    computedAt: string
  }
}

/** The output of computing charts for one category. */
export interface CategoryChartResult {
  categoryId: string
  votingPeriodId: string
  entries: ChartEntry[]
  computedAt: string
  /** True when both quorum thresholds were met (≥50 unique fans, ≥8 DJ ballots). */
  quorumMet: boolean
}

// ─── Quorum thresholds ────────────────────────────────────────────────────────

/** Minimum unique fan voters required for chart publication. */
const FAN_QUORUM_MIN = 50

/** Minimum DJ ballots required for chart publication. */
const DJ_QUORUM_MIN = 8

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * Computes chart rankings for a single category in a voting period.
 *
 * Algorithm:
 * 1. Fan votes → quadratic credit sums per release → temporal decay weighting → MinMaxNorm.
 * 2. DJ ballots → Schulze method → candidate score map → MinMaxNorm.
 * 3. Apply category-specific fan/dj weights (from CATEGORY_DEFINITIONS).
 * 4. Apply quorum degradation if DJ ballot count is below threshold.
 * 5. Sort by combined score → assign ranks.
 *
 * @param votingPeriodId - The UUID of the voting period being computed.
 * @param categoryId     - The chart category slug (e.g. 'track', 'album').
 * @param fanVotes       - All fan votes for this category/period.
 * @param djBallots      - All DJ ballots for this category/period.
 * @param releases       - Release metadata for temporal decay + output labels.
 * @param periodEndDate  - End date of the voting period (for temporal decay).
 * @returns              - Ranked chart result with full transparency data.
 */
export function computeCharts(
  votingPeriodId: string,
  categoryId: string,
  fanVotes: FanVoteInput[],
  djBallots: DJBallotInput[],
  releases: ReleaseInput[],
  periodEndDate: Date,
): CategoryChartResult {
  const computedAt = new Date().toISOString()
  const releaseMap = new Map(releases.map((r) => [r.id, r]))

  // Collect all release IDs that appear in either votes or ballots
  const allReleaseIds = new Set<string>([
    ...fanVotes.map((v) => v.releaseId),
    ...djBallots.flatMap((b) => b.rankings),
  ])

  const releaseIds = Array.from(allReleaseIds)

  if (releaseIds.length === 0) {
    return {
      categoryId,
      votingPeriodId,
      entries: [],
      computedAt,
      quorumMet: false,
    }
  }

  // ── Step 1: Fan score aggregation with temporal decay ───────────────────────
  const fanScoreMap = new Map<string, number>()
  releaseIds.forEach((id) => fanScoreMap.set(id, 0))

  for (const vote of fanVotes) {
    const temporalWeight = calculateTemporalWeight(vote.createdAt, periodEndDate)
    const weightedCredits = vote.creditsSpent * temporalWeight
    fanScoreMap.set(vote.releaseId, (fanScoreMap.get(vote.releaseId) ?? 0) + weightedCredits)
  }

  const rawFanScores = releaseIds.map((id) => fanScoreMap.get(id) ?? 0)
  const normalizedFanScores = minMaxNormalize(rawFanScores)

  // ── Step 2: DJ score via Schulze method ─────────────────────────────────────
  let normalizedDjScores: number[]

  if (djBallots.length > 0) {
    const schulzeBallots = djBallots.map((b) => ({
      djId: b.djId,
      rankings: b.rankings,
    }))

    const schulzeResult = calculateSchulzeMethod(releaseIds, schulzeBallots)

    // Convert Schulze ranking to scores: top-ranked gets score 1, last gets 0
    const schulzeScoreMap = new Map<string, number>()
    schulzeResult.rankings.forEach((id, idx) => {
      // Higher rank (lower index) = higher score
      const score = releaseIds.length - idx
      schulzeScoreMap.set(id, score)
    })

    const rawDjScores = releaseIds.map((id) => schulzeScoreMap.get(id) ?? 0)
    normalizedDjScores = minMaxNormalize(rawDjScores)
  } else {
    normalizedDjScores = releaseIds.map(() => 0)
  }

  // ── Step 3: Resolve category weights ────────────────────────────────────────
  const categoryDef = CATEGORY_DEFINITIONS[categoryId as AllCategory]
  const baseWeights = categoryDef
    ? { fan: categoryDef.fanWeight, dj: categoryDef.djWeight }
    : resolveWeights()

  // ── Step 4: Check DJ quorum and adjust weights if needed ────────────────────
  const quorumStatus = evaluateQuorum(djBallots.length, baseWeights)
  const weights = quorumStatus.adjustedWeights

  // Overall quorum: both fan and DJ minimums must be met
  const uniqueFanVoters = new Set(fanVotes.map((v) => v.userId)).size
  const quorumMet =
    uniqueFanVoters >= FAN_QUORUM_MIN && djBallots.length >= DJ_QUORUM_MIN

  // ── Step 5: Combine scores and rank ─────────────────────────────────────────
  const combinedScores = releaseIds.map((id, idx) => {
    const normFan = normalizedFanScores[idx] ?? 0
    const normDj = normalizedDjScores[idx] ?? 0
    const combined = normFan * weights.fan + normDj * weights.dj

    return {
      releaseId: id,
      fanScore: normFan,
      djScore: normDj,
      combined,
    }
  })

  // Sort descending by combined score
  combinedScores.sort((a, b) => b.combined - a.combined)

  // ── Step 6: Build output entries ─────────────────────────────────────────────
  const entries: ChartEntry[] = combinedScores.map((s, idx) => {
    const release = releaseMap.get(s.releaseId)

    return {
      rank: idx + 1,
      releaseId: s.releaseId,
      releaseTitle: release?.title ?? s.releaseId,
      bandName: release?.bandName ?? '',
      scores: {
        fanScore: s.fanScore,
        djScore: s.djScore,
        combined: s.combined,
        appliedWeights: { fan: weights.fan, dj: weights.dj },
      },
      metadata: {
        totalFanVotes: fanVotes.filter((v) => v.releaseId === s.releaseId).length,
        totalDJBallots: djBallots.filter((b) => b.rankings.includes(s.releaseId)).length,
        quorumMet,
        quorumWarning: quorumStatus.warning,
        computedAt,
      },
    }
  })

  return {
    categoryId,
    votingPeriodId,
    entries,
    computedAt,
    quorumMet,
  }
}

/**
 * Runs chart computation for all 13 chart-eligible categories.
 *
 * @param votingPeriodId      - The voting period UUID.
 * @param allFanVotes         - All fan votes for the period (keyed by categoryId).
 * @param allDjBallots        - All DJ ballots for the period (keyed by categoryId).
 * @param allReleases         - All releases metadata.
 * @param periodEndDate       - End date of the voting period.
 * @returns Array of results, one per chart-eligible category.
 */
export function computeAllCharts(
  votingPeriodId: string,
  allFanVotes: Map<string, FanVoteInput[]>,
  allDjBallots: Map<string, DJBallotInput[]>,
  allReleases: ReleaseInput[],
  periodEndDate: Date,
): CategoryChartResult[] {
  const chartEligibleCategories = getChartEligibleCategories()

  return chartEligibleCategories.map((category) => {
    const categoryFanVotes = allFanVotes.get(category.id) ?? []
    const categoryDjBallots = allDjBallots.get(category.id) ?? []

    // Filter to releases that are relevant to this category
    const categoryReleaseIds = new Set<string>([
      ...categoryFanVotes.map((v) => v.releaseId),
      ...categoryDjBallots.flatMap((b) => b.rankings),
    ])

    const categoryReleases = allReleases.filter((r) => categoryReleaseIds.has(r.id))

    return computeCharts(
      votingPeriodId,
      category.id,
      categoryFanVotes,
      categoryDjBallots,
      categoryReleases,
      periodEndDate,
    )
  })
}
