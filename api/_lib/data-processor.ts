import type { Band, Track, FanVote, ChartEntry } from '../../src/lib/types'
import type { AllCategory } from '../../src/lib/types'
import { calculateCategoryScore, CATEGORY_DEFINITIONS } from '../../src/lib/categories'
import { seededRandom } from '../../src/lib/utils'

export interface ChartComputeOptions {
  category?: AllCategory
  limit?: number
}

/**
 * Computes the composite chart ranking for a set of tracks.
 */
export function computeChartEntries(
  bands: Band[],
  tracks: Track[],
  fanVotes: Record<string, FanVote>,
  options: ChartComputeOptions = {}
): ChartEntry[] {
  const { limit } = options

  const bandMap = new Map(bands.map((b) => [b.id, b]))

  const entries: ChartEntry[] = tracks
    .map((track, idx) => {
      const band = bandMap.get(track.bandId)
      if (!band) return null

      const fanCredits = fanVotes[track.id]?.creditsSpent ?? 0
      const fanVoteCount = fanVotes[track.id]?.votes ?? 0
      const djScore = Math.floor(seededRandom(idx * 3 + 1) * 30 + idx * 5)
      const peerScore = Math.floor(seededRandom(idx * 3 + 2) * 25 + idx * 4)

      const categoryId: AllCategory = 'track'
      const compositeScore = calculateCategoryScore(categoryId, fanCredits, djScore, peerScore)

      return {
        track,
        band,
        fanVotes: fanVoteCount,
        fanCreditsSpent: fanCredits,
        djScore,
        peerVotes: peerScore,
        overallRank: 0,
        compositeScore,
      } as ChartEntry & { compositeScore: number }
    })
    .filter(Boolean) as (ChartEntry & { compositeScore: number })[]

  entries.sort((a, b) => (b as any).compositeScore - (a as any).compositeScore)

  const ranked = entries.map((entry, idx) => ({ ...entry, overallRank: idx + 1 }))

  return limit ? ranked.slice(0, limit) : ranked
}

/**
 * Normalises a raw fan vote count to a 0–100 score for composite calculation.
 */
export function normaliseFanCredits(credits: number): number {
  const MAX_CREDITS = 100
  return Math.min((credits / MAX_CREDITS) * 100, 100)
}

/**
 * Groups tracks by genre for genre-specific chart views.
 */
export function groupTracksByGenre(tracks: Track[]): Record<string, Track[]> {
  return tracks.reduce<Record<string, Track[]>>((acc, track) => {
    const genre = track.category
    if (!acc[genre]) acc[genre] = []
    acc[genre].push(track)
    return acc
  }, {})
}

/**
 * Filters tracks to only those eligible for a given category.
 */
export function filterTracksForCategory(
  tracks: Track[],
  bands: Band[],
  category: AllCategory
): Track[] {
  const meta = CATEGORY_DEFINITIONS[category]
  if (!meta) return tracks

  const bandMap = new Map(bands.map((b) => [b.id, b]))

  return tracks.filter((track) => {
    const band = bandMap.get(track.bandId)
    if (!band) return false

    if (meta.tierRestriction && !meta.tierRestriction.includes(band.tier)) {
      return false
    }
    if (meta.maxListeners && band.spotifyMonthlyListeners > meta.maxListeners) {
      return false
    }
    return true
  })
}
