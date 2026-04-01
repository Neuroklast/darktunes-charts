/**
 * @module domain/genres/taxonomy
 *
 * Hierarchical genre taxonomy for Dark Music.
 * Defines 5 root categories and 23 sub-genres used for band and release classification.
 *
 * The taxonomy was designed to represent the diversity of the DACH dark music scene,
 * covering distinct sub-cultures with their own venues, DJs, and fan bases.
 * Bands may select 1–3 genre tags (1 primary + up to 2 secondary).
 */

/** The five root genre families in the Dark Music taxonomy. */
export type GenreRoot =
  | 'gothic'
  | 'electronic'
  | 'metal-adjacent'
  | 'folk-ambient'
  | 'post-punk'

/** A single sub-genre within the taxonomy hierarchy. */
export interface SubGenre {
  /** Machine-readable kebab-case identifier (e.g. 'dark-electro'). */
  id: string
  /** Human-readable display name (e.g. 'Dark Electro'). */
  name: string
  /** The root family this sub-genre belongs to. */
  root: GenreRoot
}

/**
 * A genre tag is the string ID of a sub-genre (e.g. 'darkwave', 'ebm').
 * Used in band profiles and release metadata.
 */
export type GenreTag = string

/** Complete hierarchical genre taxonomy — 5 roots, 23 sub-genres. */
export const GENRE_TAXONOMY: Record<GenreRoot, SubGenre[]> = {
  gothic: [
    { id: 'darkwave', name: 'Darkwave', root: 'gothic' },
    { id: 'deathrock', name: 'Deathrock', root: 'gothic' },
    { id: 'gothic-rock', name: 'Gothic Rock', root: 'gothic' },
    { id: 'ethereal-wave', name: 'Ethereal Wave', root: 'gothic' },
    { id: 'gothic-metal', name: 'Gothic Metal', root: 'gothic' },
  ],
  electronic: [
    { id: 'ebm', name: 'EBM', root: 'electronic' },
    { id: 'dark-electro', name: 'Dark Electro', root: 'electronic' },
    { id: 'aggrotech', name: 'Aggrotech', root: 'electronic' },
    { id: 'futurepop', name: 'Futurepop', root: 'electronic' },
    { id: 'synthpop', name: 'Synthpop', root: 'electronic' },
    { id: 'industrial', name: 'Industrial', root: 'electronic' },
    { id: 'witch-house', name: 'Witch House', root: 'electronic' },
  ],
  'metal-adjacent': [
    { id: 'ndh', name: 'Neue Deutsche Härte', root: 'metal-adjacent' },
    { id: 'symphonic-metal', name: 'Symphonic Metal', root: 'metal-adjacent' },
    { id: 'doom-metal', name: 'Doom Metal', root: 'metal-adjacent' },
    { id: 'black-metal', name: 'Black Metal / DSBM', root: 'metal-adjacent' },
  ],
  'folk-ambient': [
    { id: 'neofolk', name: 'Neofolk', root: 'folk-ambient' },
    { id: 'dark-ambient', name: 'Dark Ambient', root: 'folk-ambient' },
    { id: 'martial-industrial', name: 'Martial Industrial', root: 'folk-ambient' },
    { id: 'medieval', name: 'Medieval / Mittelalterrock', root: 'folk-ambient' },
  ],
  'post-punk': [
    { id: 'post-punk-revival', name: 'Post-Punk Revival', root: 'post-punk' },
    { id: 'coldwave', name: 'Coldwave', root: 'post-punk' },
    { id: 'ndw', name: 'Neue Deutsche Welle', root: 'post-punk' },
  ],
}

/** Maximum number of genre tags a band or release may have. */
const MAX_GENRE_TAGS = 3

/** Flat set of all valid genre tag IDs for O(1) lookup. */
const ALL_GENRE_IDS: ReadonlySet<string> = new Set(
  Object.values(GENRE_TAXONOMY).flatMap(genres => genres.map(g => g.id)),
)

/**
 * Checks whether a given string is a valid genre tag ID.
 *
 * @param tag - The genre tag string to validate.
 * @returns `true` if the tag matches a known sub-genre ID in the taxonomy.
 */
export function isValidGenreTag(tag: string): boolean {
  return ALL_GENRE_IDS.has(tag)
}

/**
 * Returns all sub-genres belonging to the given root category.
 *
 * @param root - The root genre category.
 * @returns Array of sub-genres in definition order.
 */
export function getGenresByRoot(root: GenreRoot): SubGenre[] {
  return GENRE_TAXONOMY[root]
}

/**
 * Returns a flat array of all sub-genres across all root categories.
 *
 * @returns All 26 sub-genres in taxonomy definition order.
 */
export function getAllGenres(): SubGenre[] {
  return Object.values(GENRE_TAXONOMY).flat()
}

/**
 * Validates a band's genre tag selection.
 *
 * Rules:
 * - At least 1 genre tag required (primary).
 * - Maximum 3 genre tags (1 primary + 2 secondary).
 * - All tags must be valid genre IDs from the taxonomy.
 * - No duplicate tags allowed.
 *
 * @param genres - Array of genre tag IDs to validate.
 * @returns Validation result with `valid` flag and optional `error` message.
 */
export function validateBandGenres(genres: GenreTag[]): { valid: boolean; error?: string } {
  if (genres.length === 0) {
    return { valid: false, error: 'At least one primary genre is required.' }
  }

  if (genres.length > MAX_GENRE_TAGS) {
    return {
      valid: false,
      error: `A band may have at most ${MAX_GENRE_TAGS} genres (1 primary + 2 secondary).`,
    }
  }

  const uniqueTags = new Set(genres)
  if (uniqueTags.size !== genres.length) {
    return { valid: false, error: 'Duplicate genre tags are not allowed.' }
  }

  const invalidTags = genres.filter(g => !isValidGenreTag(g))
  if (invalidTags.length > 0) {
    return { valid: false, error: `Unknown genre tag(s): ${invalidTags.join(', ')}.` }
  }

  return { valid: true }
}
