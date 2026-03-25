import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { computeChartEntries } from './_lib/data-processor'
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
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  const entries = computeChartEntries(store.bands, store.tracks, store.fanVotes, { limit })
  sendJson(res, entries)
}
