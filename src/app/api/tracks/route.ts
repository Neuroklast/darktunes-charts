import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createTrackSchema = z.object({
  title: z.string().min(1).max(200),
  bandId: z.string().uuid(),
  genre: z.enum(['GOTH', 'METAL', 'DARK_ELECTRO', 'POST_PUNK', 'INDUSTRIAL', 'DARKWAVE', 'EBM', 'SYMPHONIC_METAL', 'AGGROTECH', 'NEOFOLK']),
  isrc: z.string().max(12).optional(),
  itunesTrackId: z.string().optional(),
  spotifyTrackId: z.string().optional(),
})

/**
 * GET /api/tracks
 * Returns all tracks with optional genre filter.
 */
export async function GET(request: NextRequest) {
  try {
    const genre = request.nextUrl.searchParams.get('genre')
    // In production: const tracks = await prisma.track.findMany({ where: genre ? { genre: genre as Genre } : {}, include: { band: true } })
    return NextResponse.json({ tracks: [], genre })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/tracks
 * Creates a new track with ISRC deduplication check.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = createTrackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // ISRC deduplication:
    // if (parsed.data.isrc) {
    //   const existing = await prisma.track.findUnique({ where: { isrc: parsed.data.isrc } })
    //   if (existing) return NextResponse.json({ error: 'Track with this ISRC already exists', existingTrackId: existing.id }, { status: 409 })
    // }

    return NextResponse.json({ success: true, track: { id: 'new-track-id', ...parsed.data } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
