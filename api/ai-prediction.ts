import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { generateAIPrediction } from '../src/lib/voting'
import { URL } from 'node:url'

const GENRE_AVERAGE_GROWTH_PERCENT = 12

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    sendError(res, 405, 'Method not allowed')
    return
  }

  const store = getStore()
  const url = new URL(req.url ?? '/', 'http://localhost')
  const bandId = url.pathname.split('/').pop()

  if (!bandId) {
    sendError(res, 400, 'Missing bandId')
    return
  }

  const band = store.bands.find((b) => b.id === bandId)
  if (!band) {
    sendError(res, 404, `Band ${bandId} not found`)
    return
  }

  const bandTrackIds = new Set(store.tracks.filter((t) => t.bandId === bandId).map((t) => t.id))
  const historicalVotes = store.transparencyLog
    .filter((e) => bandTrackIds.has(e.trackId))
    .map((e) => ({ timestamp: e.timestamp, votes: e.rawVotes }))

  const previousListeners = Math.max(1, band.spotifyMonthlyListeners * 0.9)
  const result = generateAIPrediction(
    bandId,
    historicalVotes,
    band.spotifyMonthlyListeners,
    previousListeners,
    GENRE_AVERAGE_GROWTH_PERCENT
  )

  sendJson(res, { bandId, band: band.name, ...result })
}
