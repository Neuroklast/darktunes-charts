import { type NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Typed API error that carries an HTTP status code and an optional error code.
 * Throw this in route handlers and let `withErrorHandler` serialise it to JSON.
 *
 * @example
 * throw new ApiError(404, 'Band not found', 'BAND_NOT_FOUND')
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Higher-order function that wraps a Next.js route handler with unified error
 * handling.  Catches `ApiError`, `ZodError`, and any unexpected errors and
 * serialises them into a consistent JSON response shape.
 *
 * @param handler - Async function that accepts a `NextRequest` and returns a
 *                  `NextResponse`.
 * @returns A new handler function with the same signature that never throws.
 *
 * @example
 * export const POST = withErrorHandler(async (req) => {
 *   const body = MySchema.parse(await req.json())
 *   // ...
 *   return NextResponse.json({ ok: true })
 * })
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req) => {
    try {
      return await handler(req)
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, code: err.code, status: err.status },
          { status: err.status },
        )
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            status: 400,
            details: err.errors,
          },
          { status: 400 },
        )
      }
      console.error('[withErrorHandler] Unhandled error:', err)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 },
        { status: 500 },
      )
    }
  }
}
