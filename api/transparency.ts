import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError, readBody } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { createTransparencyLogEntry } from '../src/lib/votingAudit'
import { z } from 'zod'

const logEntrySchema = z.object({
  trackId: z.string().min(1),
  userId: z.string().min(1),
  voteType: z.enum(['fan', 'dj', 'peer']),
  rawVotes: z.number().int().min(0),
  creditsSpent: z.number().int().min(0).optional(),
  weight: z.number().min(0).max(1),
  reason: z.string().optional(),
})

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    sendJson(res, store.transparencyLog)
    return
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req)
      const parsed = logEntrySchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }
      const { trackId, userId, voteType, rawVotes, creditsSpent, weight, reason } = parsed.data
      const entry = createTransparencyLogEntry(trackId, userId, voteType, rawVotes, creditsSpent, weight, reason)
      store.transparencyLog.push(entry)
      sendJson(res, entry, 201)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
