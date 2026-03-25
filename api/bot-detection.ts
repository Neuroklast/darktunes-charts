import type { IncomingMessage, ServerResponse } from 'node:http'
import { getStore } from './_lib/store'
import { sendJson, sendError, readBody } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { z } from 'zod'

const updateAlertSchema = z.object({
  alertId: z.string().min(1),
  status: z.enum(['flagged', 'reviewing', 'cleared', 'confirmed_fraud']),
  reviewedBy: z.string().optional(),
})

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  const store = getStore()

  if (req.method === 'GET') {
    sendJson(res, store.botAlerts)
    return
  }

  if (req.method === 'PUT') {
    try {
      const body = await readBody(req)
      const parsed = updateAlertSchema.safeParse(body)
      if (!parsed.success) {
        sendError(res, 400, parsed.error.message)
        return
      }
      const { alertId, status, reviewedBy } = parsed.data
      const alert = store.botAlerts.find((a) => a.id === alertId)
      if (!alert) {
        sendError(res, 404, `Alert ${alertId} not found`)
        return
      }
      alert.status = status
      if (reviewedBy) alert.reviewedBy = reviewedBy
      alert.reviewedAt = Date.now()
      sendJson(res, alert)
    } catch (err) {
      sendError(res, 400, err instanceof Error ? err.message : 'Invalid request')
    }
    return
  }

  sendError(res, 405, 'Method not allowed')
}
