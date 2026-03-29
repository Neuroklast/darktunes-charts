/**
 * @module infrastructure/security/cors
 *
 * CORS header utilities for API routes.
 *
 * Configures explicit CORS headers to restrict cross-origin access to
 * whitelisted origins. In production only the deployment domain is allowed;
 * in development localhost origins are additionally permitted.
 */

import { NextResponse, type NextRequest } from 'next/server'

/** Origins allowed in development mode. */
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]

/**
 * Returns the set of allowed origins based on the current environment.
 * In production, reads `NEXT_PUBLIC_SITE_URL` from the environment.
 * Falls back to a permissive wildcard only in development.
 */
function getAllowedOrigins(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const origins: string[] = []

  if (siteUrl) {
    origins.push(siteUrl)
  }

  if (process.env.NODE_ENV === 'development') {
    origins.push(...DEV_ORIGINS)
  }

  return origins
}

/**
 * Checks whether the request origin is in the allowed list.
 *
 * @param request - The incoming request
 * @returns       - The matched origin, or null if not allowed
 */
function getMatchedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  const allowedOrigins = getAllowedOrigins()

  // If no origins are configured (e.g. missing NEXT_PUBLIC_SITE_URL in dev),
  // allow any origin in development only.
  if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'development') {
    return origin
  }

  return allowedOrigins.includes(origin) ? origin : null
}

/**
 * Adds CORS headers to a response.
 *
 * @param response - The outgoing response
 * @param origin   - The allowed origin to reflect back
 * @param methods  - HTTP methods to allow (default: GET, POST, PUT, DELETE, OPTIONS)
 */
function setCorsHeaders(
  response: NextResponse,
  origin: string,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
): void {
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 *
 * @param request - The incoming preflight request
 * @param methods - HTTP methods to allow
 * @returns       - A 204 No Content response with CORS headers, or 403 if origin is not allowed
 */
export function handleCorsOptions(
  request: NextRequest,
  methods?: string[],
): NextResponse {
  const origin = getMatchedOrigin(request)

  if (!origin) {
    return new NextResponse(null, { status: 403 })
  }

  const response = new NextResponse(null, { status: 204 })
  setCorsHeaders(response, origin, methods)
  return response
}

/**
 * Wraps a route handler with CORS header injection.
 * Automatically handles OPTIONS preflight requests.
 *
 * @param handler - The route handler to wrap
 * @param methods - Allowed HTTP methods
 * @returns       - A wrapped handler with CORS support
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>,
  methods?: string[],
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return handleCorsOptions(request, methods)
    }

    const response = await handler(request)
    const origin = getMatchedOrigin(request)

    if (origin) {
      setCorsHeaders(response, origin, methods)
    }

    return response
  }
}
