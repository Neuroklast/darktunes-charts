/**
 * @module domain/analytics/bandInsights
 *
 * Pure domain logic for band analytics.
 *
 * Aggregates fan votes, DJ mentions, chart performance, genre overlap, and
 * regional breakdowns into structured insight objects.
 *
 * Privacy note: Regional data is only included when a region has ≥minVotersPerRegion
 * voters (k-anonymity threshold). This prevents de-anonymisation of individual voters.
 *
 * All functions are pure (no side effects, no I/O).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BandInsights {
  bandId: string
  period: string
  totalFanVotes: number
  totalDJMentions: number
  averageChartPosition: number | null
  bestChartPosition: number | null
  bestCategory: string | null
  voteTrend: TrendPoint[]
  genreOverlap: GenreOverlapEntry[]
  regionalBreakdown: RegionEntry[] | null
}

export interface TrendPoint {
  period: string
  fanVotes: number
  djMentions: number
  chartPosition: number | null
}

export interface GenreOverlapEntry {
  genre: string
  overlapScore: number
}

export interface RegionEntry {
  region: string
  voterCount: number
  percentage: number
}

export interface BasicBandInsights {
  bandId: string
  period: string
  totalFanVotes: number
  totalDJMentions: number
  averageChartPosition: number | null
  bestCategory: string | null
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface FanVoteData {
  userId: string
  votes: number
}

export interface ChartResultData {
  categoryId: string
  rank: number
}

export interface RegionData {
  region: string
  count: number
}

export interface TrendEntry {
  period: string
  fanVotes: number
  djMentions: number
  chartPosition: number | null
}

export interface OtherBandData {
  genres: string[]
  sharedVoterCount: number
  totalVoterCount: number
}

export interface BandInsightsInput {
  bandId: string
  period: string
  fanVotes: FanVoteData[]
  djMentions: number
  chartResults: ChartResultData[]
  regions: RegionData[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default k-anonymity threshold: minimum voters per region for inclusion. */
const DEFAULT_K_ANONYMITY_MIN = 10
/** Used to round percentages to 2 decimal places: multiply by 100 for %, by 100 again for rounding. */
const PERCENTAGE_ROUNDING_FACTOR = 10000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function averageOrNull(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// ─── Exported pure functions ──────────────────────────────────────────────────

/**
 * Aggregates all available metrics into a full BandInsights object.
 *
 * Regional data is only included when at least one region meets the default
 * k-anonymity threshold (10 voters), ensuring voter privacy.
 *
 * @param params - Pre-fetched data for the band in the given period.
 * @returns A complete BandInsights object.
 */
export function calculateBandInsights(params: BandInsightsInput): BandInsights {
  const totalFanVotes = params.fanVotes.reduce((sum, v) => sum + v.votes, 0)

  const chartPositions = params.chartResults.map((r) => r.rank)
  const averageChartPosition = averageOrNull(chartPositions)
  const bestChartPosition =
    chartPositions.length > 0 ? Math.min(...chartPositions) : null

  const bestResult =
    params.chartResults.length > 0
      ? params.chartResults.reduce((best, r) => (r.rank < best.rank ? r : best))
      : null
  const bestCategory = bestResult?.categoryId ?? null

  const regionalBreakdown = calculateRegionalBreakdown(
    params.regions,
    DEFAULT_K_ANONYMITY_MIN,
  )

  return {
    bandId: params.bandId,
    period: params.period,
    totalFanVotes,
    totalDJMentions: params.djMentions,
    averageChartPosition,
    bestChartPosition,
    bestCategory,
    voteTrend: [],
    genreOverlap: [],
    regionalBreakdown,
  }
}

/**
 * Returns trend data sorted by period string (lexicographic — assumes YYYY-MM format).
 *
 * @param entries - Raw trend entries from historical data.
 * @returns Sorted array of TrendPoints.
 */
export function calculateVoteTrend(entries: TrendEntry[]): TrendPoint[] {
  return [...entries].sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * Calculates Jaccard-based genre overlap scores between this band and others.
 *
 * The Jaccard coefficient is computed per genre as:
 *   sharedVoterCount / totalVoterCount
 *
 * This measures how much a genre's audience overlaps with the band's fan base.
 *
 * @param bandGenres - Genre tags for the target band.
 * @param otherBandData - Voter overlap data from related bands grouped by genre.
 * @returns Sorted (descending) array of genre overlap entries.
 */
export function calculateGenreOverlap(
  bandGenres: string[],
  otherBandData: OtherBandData[],
): GenreOverlapEntry[] {
  const overlapByGenre = new Map<string, number[]>()

  for (const genre of bandGenres) {
    overlapByGenre.set(genre, [])
  }

  for (const data of otherBandData) {
    if (data.totalVoterCount === 0) continue
    const jaccardScore = data.sharedVoterCount / data.totalVoterCount

    for (const genre of data.genres) {
      if (!overlapByGenre.has(genre)) continue
      const scores = overlapByGenre.get(genre)!
      scores.push(jaccardScore)
    }
  }

  const result: GenreOverlapEntry[] = []
  for (const [genre, scores] of overlapByGenre.entries()) {
    const overlapScore = averageOrNull(scores) ?? 0
    result.push({ genre, overlapScore })
  }

  return result.sort((a, b) => b.overlapScore - a.overlapScore)
}

/**
 * Computes a privacy-safe regional breakdown of voters.
 *
 * Filters out regions below the k-anonymity threshold to prevent re-identification
 * of individual voters. Returns null when no region meets the threshold.
 *
 * @param regions - Raw per-region voter counts.
 * @param minVotersPerRegion - Minimum voters for a region to be included.
 * @returns Filtered RegionEntry[] with percentages, or null if none qualify.
 */
export function calculateRegionalBreakdown(
  regions: RegionData[],
  minVotersPerRegion: number,
): RegionEntry[] | null {
  const qualifying = regions.filter((r) => r.count >= minVotersPerRegion)

  if (qualifying.length === 0) return null

  const total = qualifying.reduce((sum, r) => sum + r.count, 0)

  return qualifying.map((r) => ({
    region: r.region,
    voterCount: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * PERCENTAGE_ROUNDING_FACTOR) / 100 : 0,
  }))
}
