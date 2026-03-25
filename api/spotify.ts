import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { getTierFromListeners } from '../src/lib/voting'
import { URL } from 'node:url'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    sendError(res, 405, 'Method not allowed')
    return
  }

  const store = getStore()
  const url = new URL(req.url ?? '/', 'http://localhost')
  const bandId = url.searchParams.get('bandId')

  if (!bandId) {
    sendError(res, 400, 'Missing bandId query parameter')
    return
  }

  const band = store.bands.find((b) => b.id === bandId)
  if (!band) {
    sendError(res, 404, `Band ${bandId} not found`)
    return
  }
  const listeners = band.spotifyMonthlyListeners
  const tier = getTierFromListeners(listeners)

  sendJson(res, { bandId, monthlyListeners: listeners, tier })
}
