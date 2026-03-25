export type Genre = 'Goth' | 'Metal' | 'Dark Electro'

export type Tier = 'Micro' | 'Emerging' | 'Established' | 'Macro'

export type UserRole = 'fan' | 'dj' | 'band' | 'ar'

export type CategoryGroup = 'music' | 'visuals' | 'community' | 'newcomer'

export type MusicCategory = 
  | 'track'
  | 'album'
  | 'voice-of-void'
  | 'riff-architect'
  | 'synthesis-steel'

export type VisualCategory =
  | 'grim-packaging'
  | 'merch-month'
  | 'shadow-cinema'

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
  spotifyUrl?: string
  bandcampUrl?: string
}

export interface Track {
  id: string
  bandId: string
  title: string
  submittedAt: number
  category: Genre
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
  votedBandId: string
  weight: number
}

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
