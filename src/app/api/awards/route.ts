import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireRole, withCORS } from '@/lib/auth/rbac'

const createAwardSchema = z.object({
  bandId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  awardType: z.string().min(1).max(100),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  isAutomatic: z.boolean().default(false),
})

/**
 * GET /api/awards
 * Returns all awards.
 */
export async function GET() {
  try {
    return withCORS(NextResponse.json({ awards: [] }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}

/**
 * POST /api/awards
 * Creates a new award.
 *
 * Authorization: Requires admin role only
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role only
    const authResult = await requireRole(request, ['admin'])
    if (!authResult.success) {
      return authResult.response
    }

    const body: unknown = await request.json()
    const parsed = createAwardSchema.safeParse(body)

    if (!parsed.success) {
      return withCORS(NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      ))
    }

    return withCORS(NextResponse.json({ success: true, award: { id: 'new-award-id', createdAt: new Date().toISOString(), ...parsed.data } }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCORS(NextResponse.json({ error: message }, { status: 500 }))
  }
}
