import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from '../_lib/store'
import { sendJson, sendError, readBody } from '../_lib/error-handler'
import { setCorsHeaders, handleOptions } from '../_lib/cors'
import { djBallotSchema } from '../_lib/validators'
import { calculateSchulzeMethod } from '../../src/lib/schulze'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    const candidateIds = store.tracks.map((t) => t.id)
    const result = store.djBallots.length > 0
      ? calculateSchulzeMethod(candidateIds, store.djBallots)
      : { rankings: [], pairwiseMatrix: [], strongestPathMatrix: [], candidates: candidateIds }
    sendJson(res, { ballots: store.djBallots, schulzeResult: result })
    return
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req)
      const parsed = djBallotSchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }
      store.djBallots.push(parsed.data)
      sendJson(res, parsed.data, 201)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
