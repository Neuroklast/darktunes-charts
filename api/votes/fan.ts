import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from '../_lib/store'
import { sendJson, sendError, readBody } from '../_lib/error-handler'
import { setCorsHeaders, handleOptions } from '../_lib/cors'
import { fanVoteSchema } from '../_lib/validators'
import { validateFanVotes, calculateQuadraticCost } from '../../src/lib/voting'
import { createTransparencyLogEntry } from '../../src/lib/votingAudit'
import { z } from 'zod'

const submitVotesSchema = z.object({
  userId: z.string().min(1),
  votes: z.array(fanVoteSchema).min(1),
})

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    sendJson(res, store.fanVotes)
    return
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req)
      const parsed = submitVotesSchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }

      const { userId, votes } = parsed.data

      const validation = validateFanVotes(votes)
      if (!validation.valid) {
        sendError(res, 422, `Vote budget exceeded: ${validation.totalCredits} credits used (max 100)`)
        return
      }

      const newLogEntries = votes.map((vote) => {
        store.fanVotes[vote.trackId] = {
          trackId: vote.trackId,
          votes: vote.votes,
          creditsSpent: calculateQuadraticCost(vote.votes),
        }
        return createTransparencyLogEntry(vote.trackId, userId, 'fan', vote.votes, vote.creditsSpent, 1.0)
      })

      store.transparencyLog.push(...newLogEntries)

      sendJson(res, { accepted: votes.length, totalCredits: validation.totalCredits, logEntries: newLogEntries }, 201)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
