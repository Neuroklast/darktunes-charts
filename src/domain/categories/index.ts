/**
 * @module domain/categories
 *
 * Pure domain layer for chart category definitions, voting weight configurations,
 * and eligibility logic. Zero React dependencies; zero external I/O.
 *
 * This is the **canonical source** for all category definitions. The legacy
 * `src/lib/categories.ts` is a backward-compatibility shim that re-exports
 * from this module.
 */
import type { AllCategory, CategoryGroup, Tier, Band } from '@/lib/types'

/**
 * Maximum number of chart categories a single band may enter per voting period.
 *
 * This cap prevents wealthy bands from gaining disproportionate platform visibility
 * by submitting to all 13 categories simultaneously (Anti-Pay2Win protection).
 * Five categories provide ample creative exposure while keeping competition fair.
 */
export const MAX_CATEGORIES_PER_BAND = 5

/** Metadata describing a single chart category and its voting weight configuration. */
export interface CategoryMetadata {
  id: AllCategory
  group: CategoryGroup
  name: string
  description: string
  icon: string
  fanWeight: number
  djWeight: number
  peerWeight: number
  /**
   * Whether this category appears in music charts.
   * - `true`  for music, visuals, and newcomer categories (directly tied to music releases).
   * - `false` for community categories (podcasts, social engagement, lyricists) which are
   *           recognised separately in the Community Awards section.
   */
  chartEligible: boolean
  tierRestriction?: Tier[]
  maxListeners?: number
}

export const CATEGORY_DEFINITIONS: Record<AllCategory, CategoryMetadata> = {
  'track': {
    id: 'track',
    group: 'music',
    name: 'Track of the Month',
    description: 'Best single track across all genres',
    icon: 'Disc',
    fanWeight: 0.4,
    djWeight: 0.3,
    peerWeight: 0.3,
    chartEligible: true,
  },
  'album': {
    id: 'album',
    group: 'music',
    name: 'Album of the Month',
    description: 'Best full-length release',
    icon: 'Vinyl',
    fanWeight: 0.4,
    djWeight: 0.3,
    peerWeight: 0.3,
    chartEligible: true,
  },
  'voice-of-void': {
    id: 'voice-of-void',
    group: 'music',
    name: 'Voice of the Void',
    description: 'Best vocal performance (from operatic soprano to deep growls)',
    icon: 'Microphone',
    fanWeight: 0.2,
    djWeight: 0.2,
    peerWeight: 0.6,
    chartEligible: true,
  },
  'riff-architect': {
    id: 'riff-architect',
    group: 'music',
    name: 'Riff Architect',
    description: 'Best guitar riff of the month',
    icon: 'GuitarPick',
    fanWeight: 0.2,
    djWeight: 0.2,
    peerWeight: 0.6,
    chartEligible: true,
  },
  'synthesis-steel': {
    id: 'synthesis-steel',
    group: 'music',
    name: 'Synthesis & Steel',
    description: 'Best genre fusion of Metal and Dark Electro',
    icon: 'Waveform',
    fanWeight: 0.3,
    djWeight: 0.4,
    peerWeight: 0.3,
    chartEligible: true,
  },
  'best-cover-art': {
    id: 'best-cover-art',
    group: 'visuals',
    name: 'Best Cover Art',
    description: 'Best physical design (vinyl color, boxset, digipak, limited edition packaging)',
    icon: 'Package',
    fanWeight: 0.7,
    djWeight: 0.15,
    peerWeight: 0.15,
    chartEligible: true,
  },
  'best-merch': {
    id: 'best-merch',
    group: 'visuals',
    name: 'Best Merch',
    description: 'Best merchandise design — apparel, accessories, and collector items',
    icon: 'TShirt',
    fanWeight: 0.7,
    djWeight: 0.15,
    peerWeight: 0.15,
    chartEligible: true,
  },
  'best-music-video': {
    id: 'best-music-video',
    group: 'visuals',
    name: 'Best Music Video',
    description: 'Best music video, official visualizer, or short film',
    icon: 'FilmSlate',
    fanWeight: 0.5,
    djWeight: 0.25,
    peerWeight: 0.25,
    chartEligible: true,
  },
  'chronicler-night': {
    id: 'chronicler-night',
    group: 'community',
    name: 'Chronicler of the Night',
    description: 'Best scene channel (podcasts, YouTube reviewers, zines)',
    icon: 'Newspaper',
    fanWeight: 0.6,
    djWeight: 0.2,
    peerWeight: 0.2,
    chartEligible: false,
  },
  'dark-integrity': {
    id: 'dark-integrity',
    group: 'community',
    name: 'Dark Integrity Award',
    description: 'For bands/actors with social engagement (anti-mobbing, mental health)',
    icon: 'HandHeart',
    fanWeight: 0.5,
    djWeight: 0.25,
    peerWeight: 0.25,
    chartEligible: false,
  },
  'lyricist-shadows': {
    id: 'lyricist-shadows',
    group: 'community',
    name: 'Lyricist of the Shadows',
    description: 'Best songwriting and lyrical content',
    icon: 'PenNib',
    fanWeight: 0.3,
    djWeight: 0.2,
    peerWeight: 0.5,
    chartEligible: false,
  },
  'underground-anthem': {
    id: 'underground-anthem',
    group: 'newcomer',
    name: 'Underground Anthem',
    description: 'Best track from bands with <10k monthly listeners',
    icon: 'FlameSimple',
    fanWeight: 0.5,
    djWeight: 0.25,
    peerWeight: 0.25,
    chartEligible: true,
    tierRestriction: ['Micro', 'Emerging'],
    maxListeners: 10000
  },
  'dark-concept': {
    id: 'dark-concept',
    group: 'newcomer',
    name: 'The Dark Concept',
    description: 'Best concept album with cohesive storytelling',
    icon: 'Book',
    fanWeight: 0.4,
    djWeight: 0.3,
    peerWeight: 0.3,
    chartEligible: true,
  }
}

export const CATEGORY_GROUPS: Record<CategoryGroup, { name: string; description: string; categories: AllCategory[] }> = {
  music: {
    name: 'Music Performance',
    description: 'Core musical excellence and technical skill',
    categories: ['track', 'album', 'voice-of-void', 'riff-architect', 'synthesis-steel']
  },
  visuals: {
    name: 'Visuals & Aesthetics',
    description: 'Physical media, merchandise, and audiovisual excellence',
    categories: ['best-cover-art', 'best-merch', 'best-music-video']
  },
  community: {
    name: 'Community & Spirit',
    description: 'Scene building and engagement',
    categories: ['chronicler-night', 'dark-integrity', 'lyricist-shadows']
  },
  newcomer: {
    name: 'Newcomer & Niche',
    description: 'Protected space for emerging artists',
    categories: ['underground-anthem', 'dark-concept']
  }
}

/**
 * Returns the metadata for a single chart category.
 * @param categoryId - The unique identifier of the category.
 * @returns Category metadata including name, weights, and any tier restrictions.
 */
export function getCategoryMetadata(categoryId: AllCategory): CategoryMetadata {
  return CATEGORY_DEFINITIONS[categoryId]
}

/**
 * Returns all category metadata objects belonging to a given group.
 * @param group - The category group (music | visuals | community | newcomer).
 * @returns Array of category metadata in group definition order.
 */
export function getCategoriesByGroup(group: CategoryGroup): CategoryMetadata[] {
  return CATEGORY_GROUPS[group].categories.map(id => CATEGORY_DEFINITIONS[id])
}

/**
 * Determines whether a band is eligible to compete in a specific category.
 *
 * Enforces tier restrictions (e.g., Underground Anthem allows only Micro/Emerging)
 * and absolute listener caps (e.g., maxListeners = 10,000 for underground categories).
 *
 * @param category - The chart category being checked.
 * @param tier - The band's current tier classification.
 * @param monthlyListeners - The band's Spotify monthly listener count.
 * @returns `true` if the band meets all eligibility requirements.
 */
export function canBandCompeteInCategory(category: AllCategory, tier: Tier, monthlyListeners: number): boolean {
  const meta = CATEGORY_DEFINITIONS[category]

  if (meta.tierRestriction && !meta.tierRestriction.includes(tier)) {
    return false
  }

  if (meta.maxListeners && monthlyListeners > meta.maxListeners) {
    return false
  }

  return true
}

/**
 * Calculates the weighted composite score for a track in a given category.
 *
 * Normalises raw vote counts from all three pillars (Fan, DJ, Peer) and applies
 * category-specific weights to derive a final score on a 0–100 scale.
 * The weights for each category are defined in CATEGORY_DEFINITIONS.
 *
 * @param categoryId - The category for which to calculate the score.
 * @param fanVotes - Raw fan quadratic vote count (normalised against 100 credits).
 * @param djScore - DJ Schulze-method score (normalised 0–100).
 * @param peerVotes - Peer review clique-adjusted score (normalised 0–100).
 * @returns Composite score in the range 0–100.
 */
export function calculateCategoryScore(
  categoryId: AllCategory,
  fanVotes: number,
  djScore: number,
  peerVotes: number
): number {
  const meta = CATEGORY_DEFINITIONS[categoryId]

  const normalizedFan  = fanVotes  / 100
  const normalizedDJ   = djScore   / 100
  const normalizedPeer = peerVotes / 100

  return (
    normalizedFan  * meta.fanWeight +
    normalizedDJ   * meta.djWeight +
    normalizedPeer * meta.peerWeight
  ) * 100
}

/**
 * Returns all categories that are eligible to appear in music charts.
 *
 * Filters out community award categories (podcasts, social engagement, lyricists)
 * which are recognised in a separate Community Awards section and must not
 * distort the music chart rankings.
 *
 * @returns Array of chart-eligible category metadata objects.
 */
export function getChartEligibleCategories(): CategoryMetadata[] {
  return (Object.values(CATEGORY_DEFINITIONS) as CategoryMetadata[]).filter(
    meta => meta.chartEligible,
  )
}

/**
 * Returns all community award categories that are NOT chart-eligible.
 *
 * These categories recognise non-musical contributions such as scene media,
 * social engagement, and lyrical craft. They are presented separately from
 * music rankings to avoid mixing incompatible competition criteria.
 *
 * @returns Array of community category metadata objects.
 */
export function getCommunityAwardCategories(): CategoryMetadata[] {
  return (Object.values(CATEGORY_DEFINITIONS) as CategoryMetadata[]).filter(
    meta => !meta.chartEligible,
  )
}

/** Validation result for a band's category selection. */
export interface CategorySelectionValidation {
  valid: boolean
  error?: string
  eligibleCategories: AllCategory[]
  ineligibleCategories: Array<{ id: AllCategory; reason: string }>
}

/**
 * Validates a band's category selection for a voting period submission.
 *
 * Enforces three rules:
 * 1. Maximum of MAX_CATEGORIES_PER_BAND (5) categories per period.
 * 2. Only chart-eligible categories may be submitted (community awards are excluded).
 * 3. Tier and listener-count restrictions per category (e.g. Underground Anthem).
 *
 * @param selectedCategories - The category IDs the band wishes to enter.
 * @param band               - The band submitting the entries.
 * @returns Validation result with eligible/ineligible breakdown and an error message when invalid.
 */
export function validateCategorySelection(
  selectedCategories: AllCategory[],
  band: Band,
): CategorySelectionValidation {
  const ineligibleCategories: Array<{ id: AllCategory; reason: string }> = []
  const eligibleCategories: AllCategory[] = []

  for (const categoryId of selectedCategories) {
    const meta = CATEGORY_DEFINITIONS[categoryId]

    if (!meta.chartEligible) {
      ineligibleCategories.push({ id: categoryId, reason: 'Community award categories cannot be submitted as chart entries.' })
      continue
    }

    if (meta.tierRestriction && !meta.tierRestriction.includes(band.tier)) {
      ineligibleCategories.push({ id: categoryId, reason: `Category "${meta.name}" is restricted to tiers: ${meta.tierRestriction.join(', ')}.` })
      continue
    }

    if (meta.maxListeners && band.spotifyMonthlyListeners > meta.maxListeners) {
      ineligibleCategories.push({ id: categoryId, reason: `Category "${meta.name}" requires fewer than ${meta.maxListeners.toLocaleString()} monthly listeners.` })
      continue
    }

    eligibleCategories.push(categoryId)
  }

  if (selectedCategories.length > MAX_CATEGORIES_PER_BAND) {
    return {
      valid: false,
      error: `A band may enter at most ${MAX_CATEGORIES_PER_BAND} categories per period. ${selectedCategories.length} were selected.`,
      eligibleCategories,
      ineligibleCategories,
    }
  }

  if (ineligibleCategories.length > 0) {
    return {
      valid: false,
      error: `${ineligibleCategories.length} category(s) cannot be entered: ${ineligibleCategories.map(c => c.id).join(', ')}.`,
      eligibleCategories,
      ineligibleCategories,
    }
  }

  return { valid: true, eligibleCategories, ineligibleCategories }
}
