import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError, readBody } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const trackSchema = z.object({
  bandId: z.string().min(1),
  title: z.string().min(1).max(300),
  category: z.enum(['Goth', 'Metal', 'Dark Electro']),
  spotifyEmbedUrl: z.string().url().optional(),
  bandcampEmbedUrl: z.string().url().optional(),
  primaryEmbed: z.enum(['spotify', 'bandcamp']).optional(),
})

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    sendJson(res, store.tracks)
    return
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req)
      const parsed = trackSchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }
      const bandExists = store.bands.some((b) => b.id === parsed.data.bandId)
      if (!bandExists) {
        sendError(res, 404, `Band ${parsed.data.bandId} not found`)
        return
      }
      const track = {
        id: uuidv4(),
        ...parsed.data,
        submittedAt: Date.now(),
      }
      store.tracks.push(track)
      sendJson(res, track, 201)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
