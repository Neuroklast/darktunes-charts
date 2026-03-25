import type { IncomingMessage, ServerResponse } from 'node:http'

const ALLOWED_ORIGINS = ['*']

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = (req.headers['origin'] as string) ?? '*'
  const allowed = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export function handleOptions(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res)
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}
