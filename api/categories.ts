import type { IncomingMessage, ServerResponse } from 'node:http'
import { sendJson, sendError } from './_lib/error-handler'
import { setCorsHeaders, handleOptions } from './_lib/cors'
import { CATEGORY_DEFINITIONS, CATEGORY_GROUPS } from '../src/lib/categories'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    sendError(res, 405, 'Method not allowed')
    return
  }

  sendJson(res, { definitions: CATEGORY_DEFINITIONS, groups: CATEGORY_GROUPS })
}
