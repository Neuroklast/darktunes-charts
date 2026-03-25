import type { AllCategory, CategoryGroup, Tier } from './types'

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
    peerWeight: 0.3
  },
  'album': {
    id: 'album',
    group: 'music',
    name: 'Album of the Month',
    description: 'Best full-length release',
    icon: 'Vinyl',
    fanWeight: 0.4,
    djWeight: 0.3,
    peerWeight: 0.3
  },
  'voice-of-void': {
    id: 'voice-of-void',
    group: 'music',
    name: 'Voice of the Void',
    description: 'Best vocal performance (from operatic soprano to deep growls)',
    icon: 'Microphone',
    fanWeight: 0.2,
    djWeight: 0.2,
    peerWeight: 0.6
  },
  'riff-architect': {
    id: 'riff-architect',
    group: 'music',
    name: 'Riff Architect',
    description: 'Best guitar riff of the month',
    icon: 'GuitarPick',
    fanWeight: 0.2,
    djWeight: 0.2,
    peerWeight: 0.6
  },
  'synthesis-steel': {
    id: 'synthesis-steel',
    group: 'music',
    name: 'Synthesis & Steel',
    description: 'Best genre fusion of Metal and Dark Electro',
    icon: 'Waveform',
    fanWeight: 0.3,
    djWeight: 0.4,
    peerWeight: 0.3
  },
  'best-cover-art': {
    id: 'best-cover-art',
    group: 'visuals',
    name: 'Best Cover Art',
    description: 'Best physical design (vinyl color, boxset, digipak, limited edition packaging)',
    icon: 'Package',
    fanWeight: 0.7,
    djWeight: 0.15,
    peerWeight: 0.15
  },
  'best-merch': {
    id: 'best-merch',
    group: 'visuals',
    name: 'Best Merch',
    description: 'Best merchandise design — apparel, accessories, and collector items',
    icon: 'TShirt',
    fanWeight: 0.7,
    djWeight: 0.15,
    peerWeight: 0.15
  },
  'best-music-video': {
    id: 'best-music-video',
    group: 'visuals',
    name: 'Best Music Video',
    description: 'Best music video, official visualizer, or short film',
    icon: 'FilmSlate',
    fanWeight: 0.5,
    djWeight: 0.25,
    peerWeight: 0.25
  },
  'chronicler-night': {
    id: 'chronicler-night',
    group: 'community',
    name: 'Chronicler of the Night',
    description: 'Best scene channel (podcasts, YouTube reviewers, zines)',
    icon: 'Newspaper',
    fanWeight: 0.6,
    djWeight: 0.2,
    peerWeight: 0.2
  },
  'dark-integrity': {
    id: 'dark-integrity',
    group: 'community',
    name: 'Dark Integrity Award',
    description: 'For bands/actors with social engagement (anti-mobbing, mental health)',
    icon: 'HandHeart',
    fanWeight: 0.5,
    djWeight: 0.25,
    peerWeight: 0.25
  },
  'lyricist-shadows': {
    id: 'lyricist-shadows',
    group: 'community',
    name: 'Lyricist of the Shadows',
    description: 'Best songwriting and lyrical content',
    icon: 'PenNib',
    fanWeight: 0.3,
    djWeight: 0.2,
    peerWeight: 0.5
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
    peerWeight: 0.3
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
