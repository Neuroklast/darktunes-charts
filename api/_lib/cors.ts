import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Allowed CORS origins.
 *
 * Set the ALLOWED_ORIGINS environment variable to a comma-separated list of
 * trusted domains for production deployments (e.g. "https://darktunes.com").
 * Defaults to '*' (all origins) for local development and preview environments.
 * Do NOT use '*' in production — restrict to your actual frontend domain.
 */
const ALLOWED_ORIGINS: string[] = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map((o) => o.trim())
  : ['*']

export function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = (req.headers['origin'] as string) ?? ''
  const isWildcard = ALLOWED_ORIGINS.includes('*')
  const isAllowed = isWildcard || ALLOWED_ORIGINS.includes(origin)

  if (isAllowed) {
    // Echo back the specific origin when not using wildcard (required for credentialed requests)
    res.setHeader('Access-Control-Allow-Origin', isWildcard ? '*' : origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
  if (!isWildcard && isAllowed) {
    res.setHeader('Vary', 'Origin')
  }
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

