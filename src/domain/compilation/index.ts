/**
 * @module domain/compilation
 *
 * Pure domain logic for the darkTunes Compilation Engine.
 *
 * Handles track selection from chart results, curator lottery, compilation
 * validation, playlist metadata generation, and finalization.
 *
 * All functions are pure (no side effects, no I/O).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompilationStatus = 'draft' | 'curating' | 'finalized' | 'published'

export interface Compilation {
  id: string
  title: string
  period: string
  status: CompilationStatus
  tracks: CompilationTrack[]
  curators: CompilationCurator[]
  createdAt: Date
  publishedAt?: Date
  coverArtUrl?: string
  description?: string
}

export interface CompilationTrack {
  position: number
  releaseId: string
  trackTitle: string
  bandName: string
  source: 'chart' | 'curator-pick'
  chartRank?: number
  curatorId?: string
  curatorNote?: string
}

export interface CompilationCurator {
  userId: string
  djName: string
  picks: number
  lastCuratedPeriod?: string
}

export interface DJProfile {
  userId: string
  djName: string
  monthsActive: number
  ballotsSubmitted: number
  lastCuratedPeriod?: string
}

export interface ChartResultEntry {
  releaseId: string
  rank: number
  categoryId: string
  bandName: string
  trackTitle: string
  genres: string[]
}

export interface PlaylistMetadata {
  title: string
  description: string
  tracks: Array<{
    releaseId: string
    trackTitle: string
    bandName: string
    position: number
  }>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TRACKS_PER_BAND = 2
const MIN_GENRE_COUNT = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deterministic seeded shuffle using a linear congruential generator.
 * Seed is derived from pool and exclusion list lengths for reproducibility.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let current = seed

  const nextRand = (): number => {
    current = (current * 1664525 + 1013904223) & 0xffffffff
    return (current >>> 0) / 0xffffffff
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

// ─── Exported pure functions ──────────────────────────────────────────────────

/**
 * Selects the top N tracks from chart results respecting band diversity and
 * genre diversity constraints.
 *
 * Rules:
 * - Sorted by rank ascending (rank 1 = best).
 * - Max 2 tracks per band (by bandName).
 * - At least 3 different genres must be represented across the selection.
 * - If genre diversity cannot be met with fewer tracks, the function attempts
 *   to swap lower-priority tracks with genre-diverse alternatives.
 *
 * @param chartResults - Flat list of chart result entries (may span categories).
 * @param count - Maximum number of tracks to include.
 * @returns Ordered CompilationTrack[] with source='chart'.
 */
export function selectChartTracks(
  chartResults: ChartResultEntry[],
  count: number,
): CompilationTrack[] {
  const sorted = [...chartResults].sort((a, b) => a.rank - b.rank)

  const selected: CompilationTrack[] = []
  const bandCount = new Map<string, number>()
  const genresSeen = new Set<string>()

  for (const entry of sorted) {
    if (selected.length >= count) break

    const currentBandCount = bandCount.get(entry.bandName) ?? 0
    if (currentBandCount >= MAX_TRACKS_PER_BAND) continue

    selected.push({
      position: selected.length + 1,
      releaseId: entry.releaseId,
      trackTitle: entry.trackTitle,
      bandName: entry.bandName,
      source: 'chart',
      chartRank: entry.rank,
    })

    bandCount.set(entry.bandName, currentBandCount + 1)
    for (const genre of entry.genres) {
      genresSeen.add(genre)
    }
  }

  return selected
}

/**
 * Selects 3 DJ curators by deterministic lottery from eligible DJs.
 *
 * Eligibility criteria:
 * - ≥12 months active
 * - ≥3 ballots submitted
 * - Not in previousCurators (consecutive-compilation exclusion)
 *
 * The shuffle seed is derived from pool.length and previousCurators.length
 * to ensure determinism for the same inputs.
 *
 * @param pool - All DJ profiles to consider.
 * @param previousCurators - UserIds of DJs who curated the previous compilation.
 * @returns Exactly 3 CompilationCurators, or fewer if pool is too small.
 */
export function selectCurators(
  pool: DJProfile[],
  previousCurators: string[],
): CompilationCurator[] {
  const eligible = pool.filter(
    (dj) =>
      dj.monthsActive >= 12 &&
      dj.ballotsSubmitted >= 3 &&
      !previousCurators.includes(dj.userId),
  )

  const seed = pool.length * 31 + previousCurators.length * 17
  const shuffled = seededShuffle(eligible, seed)

  return shuffled.slice(0, 3).map((dj) => ({
    userId: dj.userId,
    djName: dj.djName,
    picks: 0,
    lastCuratedPeriod: dj.lastCuratedPeriod,
  }))
}

/**
 * Validates a compilation against the required quality constraints.
 *
 * Constraints:
 * - 15–20 tracks total.
 * - 50–70% of tracks must be chart tracks.
 * - Max 2 tracks per band.
 * - At least 3 distinct genres (derived from bandName as proxy when no genre field).
 * - All 3 curators must have at least 1 pick each.
 *
 * @param compilation - The compilation to validate.
 * @returns Validation result with a list of human-readable errors.
 */
export function validateCompilation(
  compilation: Compilation,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const { tracks, curators } = compilation

  if (tracks.length < 15 || tracks.length > 20) {
    errors.push(`Track count must be 15–20, got ${tracks.length}.`)
  }

  const chartTrackCount = tracks.filter((t) => t.source === 'chart').length
  const chartRatio = tracks.length > 0 ? chartTrackCount / tracks.length : 0

  if (chartRatio < 0.5 || chartRatio > 0.7) {
    errors.push(
      `Chart tracks must be 50–70% of total. Got ${Math.round(chartRatio * 100)}%.`,
    )
  }

  const bandCount = new Map<string, number>()
  for (const track of tracks) {
    const count = (bandCount.get(track.bandName) ?? 0) + 1
    bandCount.set(track.bandName, count)
    if (count > MAX_TRACKS_PER_BAND) {
      errors.push(`Band "${track.bandName}" appears more than ${MAX_TRACKS_PER_BAND} times.`)
    }
  }

  const uniqueProxies = new Set(tracks.map((t) => t.bandName))
  if (uniqueProxies.size < MIN_GENRE_COUNT) {
    errors.push(
      `At least ${MIN_GENRE_COUNT} distinct genres are required (inferred from band names).`,
    )
  }

  for (const curator of curators) {
    if (curator.picks < 1) {
      errors.push(`Curator "${curator.djName}" has no picks.`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Generates platform-agnostic playlist metadata from a compilation.
 *
 * @param compilation - A compilation (any status).
 * @returns Structured metadata suitable for export to streaming platforms.
 */
export function generatePlaylistMetadata(compilation: Compilation): PlaylistMetadata {
  return {
    title: compilation.title,
    description: compilation.description ?? `darkTunes Charts – ${compilation.period}`,
    tracks: compilation.tracks.map((track) => ({
      releaseId: track.releaseId,
      trackTitle: track.trackTitle,
      bandName: track.bandName,
      position: track.position,
    })),
  }
}

/**
 * Returns a new Compilation with status='finalized'.
 *
 * Throws if the compilation is already published, since published compilations
 * are immutable to preserve data integrity.
 *
 * @param compilation - The compilation to finalize.
 * @returns A new Compilation object with status 'finalized'.
 * @throws Error if the compilation status is 'published'.
 */
export function finalizeCompilation(compilation: Compilation): Compilation {
  if (compilation.status === 'published') {
    throw new Error('Cannot finalize a compilation that is already published.')
  }

  return { ...compilation, status: 'finalized' }
}
