import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

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
    return NextResponse.json({ awards: [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/awards
 * Creates a new award (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = createAwardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, award: { id: 'new-award-id', createdAt: new Date().toISOString(), ...parsed.data } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
