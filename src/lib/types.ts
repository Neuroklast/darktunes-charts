export type Genre = 'Goth' | 'Metal' | 'Dark Electro'

/** Five-tier classification based on Spotify monthly listeners as defined in the platform spec. */
export type Tier = 'Micro' | 'Emerging' | 'Established' | 'International' | 'Macro'

/**
 * Platform user roles with distinct permissions.
 * - fan: Public voter with 100 Voice Credits/month (Quadratic Voting)
 * - band: Registered artist; peer-review voter; free 1 category/month
 * - dj: Verified scene DJ; ranked-choice Schulze ballot voter
 * - editor: Editorial staff; can write spotlights and manage nominations
 * - admin: Full platform administration and KYC verification
 * - ar: A&R professional with access to B2B scouting dashboard
 * - label: Record label with mandated band access
 */
export type UserRole = 'fan' | 'dj' | 'band' | 'editor' | 'admin' | 'ar' | 'label'

export type CategoryGroup = 'music' | 'visuals' | 'community' | 'newcomer'

export type MusicCategory = 
  | 'track'
  | 'album'
  | 'voice-of-void'
  | 'riff-architect'
  | 'synthesis-steel'

export type VisualCategory =
  | 'best-cover-art'
  | 'best-merch'
  | 'best-music-video'

export type CommunityCategory =
  | 'chronicler-night'
  | 'dark-integrity'
  | 'lyricist-shadows'

export type NewcomerCategory =
  | 'underground-anthem'
  | 'dark-concept'

export type AllCategory = MusicCategory | VisualCategory | CommunityCategory | NewcomerCategory

export interface Band {
  id: string
  name: string
  genre: Genre
  spotifyMonthlyListeners: number
  tier: Tier
  logoUrl?: string
  coverArtUrl?: string
  spotifyUrl?: string
  bandcampUrl?: string
  spotifyArtistId?: string
  country?: string
  formedYear?: number
}

export interface Track {
  id: string
  bandId: string
  title: string
  submittedAt: number
  category: Genre
  spotifyTrackId?: string
  itunesTrackId?: string
  odesliUrl?: string
  coverArtUrl?: string
  spotifyEmbedUrl?: string
  bandcampEmbedUrl?: string
  primaryEmbed?: 'spotify' | 'bandcamp'
}

export interface FanVote {
  trackId: string
  votes: number
  creditsSpent: number
}

export interface DJBallot {
  rankings: string[]
}

export interface BandVote {
  voterId: string       // ID of the band casting this peer vote
  votedBandId: string
  weight: number
}

/**
 * Authenticated platform user.
 * The `bandId` field is only populated for band accounts;
 * `isDJVerified` is set to true only after manual KYC approval by an admin.
 */
export interface AuthUser {
  id: string
  role: UserRole
  name: string
  email: string
  credits: number
  bandId?: string
  isDJVerified?: boolean
  avatarUrl?: string
  joinedAt: number
}

/** @deprecated Use AuthUser instead. Legacy alias kept for backward compatibility. */
export interface User {
  id: string
  role: UserRole
  name: string
  credits: number
  bandId?: string
  isDJVerified?: boolean
}

export interface VotingPeriod {
  id: string
  startDate: number
  endDate: number
  isActive: boolean
}

export interface ChartEntry {
  track: Track
  band: Band
  fanVotes: number
  fanCreditsSpent: number
  djScore: number
  peerVotes: number
  overallRank: number
}

export interface AIPrediction {
  bandId: string
  confidenceScore: number
  predictedTier: Tier
  factors: {
    voteVelocity: number
    genreMomentum: number
    streamGrowth: number
  }
}

export interface TransparencyLogEntry {
  id: string
  timestamp: number
  trackId: string
  userId: string
  voteType: 'fan' | 'dj' | 'peer'
  rawVotes: number
  creditsSpent?: number
  weight: number
  finalContribution: number
  reason?: string
}

export interface BotDetectionAlert {
  id: string
  timestamp: number
  trackId: string
  bandId: string
  alertType: 'velocity' | 'new_accounts' | 'ip_cluster' | 'pattern'
  severity: 'low' | 'medium' | 'high'
  details: {
    votesCount: number
    timeWindow: number
    suspiciousIPs?: string[]
    newAccountRatio?: number
  }
  status: 'flagged' | 'reviewing' | 'cleared' | 'confirmed_fraud'
  reviewedBy?: string
  reviewedAt?: number
}

export interface CategoryPricing {
  tier: Tier
  monthlyListeners: number
  pricePerCategory: number
}

export interface BandSubmission {
  bandId: string
  period: string
  categories: Genre[]
  freeCategory: Genre
  paidCategories: Genre[]
  totalCost: number
  submittedAt: number
}

/** Result from Odesli / song.link lookup for a track. */
export interface OdesliResult {
  pageUrl: string
  entityUniqueId: string
  linksByPlatform: Record<string, { url: string; nativeAppUriMobile?: string }>
  entitiesByUniqueId: Record<string, {
    id: string
    title?: string
    artistName?: string
    thumbnailUrl?: string
    apiProvider: string
    platforms: string[]
  }>
}

/** Result from iTunes Search API for a track. */
export interface ItunesTrack {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  artworkUrl100: string
  artworkUrl600?: string
  previewUrl?: string
  trackViewUrl: string
  primaryGenreName: string
  releaseDate: string
}
