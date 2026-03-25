export type Genre = 'Goth' | 'Metal' | 'Dark Electro'

export type Tier = 'Micro' | 'Emerging' | 'Established' | 'Macro'

export type UserRole = 'fan' | 'dj' | 'band' | 'ar'

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
