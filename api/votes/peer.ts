import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from '../_lib/store'
import { sendJson, sendError, readBody } from '../_lib/error-handler'
import { setCorsHeaders, handleOptions } from '../_lib/cors'
import { peerVoteSchema } from '../_lib/validators'
import { applyCliqueWeighting } from '../../src/lib/voting'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    sendJson(res, store.peerVotes)
    return
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req)
      const parsed = peerVoteSchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }

      const { voterId, votedBandId, weight } = parsed.data

      const allBandVotesMap = new Map<string, string[]>()
      for (const pv of store.peerVotes) {
        const existing = allBandVotesMap.get(pv.voterId) ?? []
        existing.push(pv.votedBandId)
        allBandVotesMap.set(pv.voterId, existing)
      }

      const [adjustedVote] = applyCliqueWeighting(
        [{ voterId, votedBandId, weight }],
        allBandVotesMap
      )

      store.peerVotes.push(adjustedVote)
      sendJson(res, adjustedVote, 201)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
