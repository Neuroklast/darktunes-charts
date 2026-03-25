import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError, readBody } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { bandSchema } from './_lib/validators'
import { getTierFromListeners } from '../src/lib/voting'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    sendJson(res, store.bands)
    return
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req)
      const parsed = bandSchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }
      const data = parsed.data
      const band = {
        id: uuidv4(),
        ...data,
        tier: getTierFromListeners(data.spotifyMonthlyListeners),
      }
      store.bands.push(band)
      sendJson(res, band, 201)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
