import type { Band, Track, FanVote, TransparencyLogEntry, BotDetectionAlert } from '../../src/lib/types'
import { SEED_BANDS, SEED_TRACKS } from '../../src/lib/seedData'
import type { BallotRanking } from '../../src/lib/schulze'

/** Singleton in-memory data store for Vercel serverless runtime. */
export interface AppStore {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
  transparencyLog: TransparencyLogEntry[]
  botAlerts: BotDetectionAlert[]
  djBallots: BallotRanking[]
  peerVotes: Array<{ voterId: string; votedBandId: string; weight: number }>
}

// Module-level store – persists within a warm serverless instance
const store: AppStore = {
  bands: [...SEED_BANDS],
  tracks: [...SEED_TRACKS],
  fanVotes: {},
  transparencyLog: [],
  botAlerts: [],
  djBallots: [],
  peerVotes: [],
}

export function getStore(): AppStore {
  return store
}

export function resetStore(): void {
  store.bands = [...SEED_BANDS]
  store.tracks = [...SEED_TRACKS]
  store.fanVotes = {}
  store.transparencyLog = []
  store.botAlerts = []
  store.djBallots = []
  store.peerVotes = []
}
