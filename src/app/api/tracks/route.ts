import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { TrackSubmissionSchema } from '@/domain/releases/index'
import { prisma } from '@/lib/prisma'

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
    const db = prisma as unknown as {
      track: {
        findMany: (args: unknown) => Promise<Array<{
          id: string; title: string; genre: string; isrc: string | null;
          spotifyTrackId: string | null; bandId: string; band: { id: string; name: string }
        }>>
      }
    }
    const tracks = await db.track.findMany({
      where: genre ? { genre } : undefined,
      include: { band: { select: { id: true, name: true } } },
      orderBy: { submittedAt: 'desc' },
    })
    return NextResponse.json({ tracks, genre })
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

    // Extended ISRC validation using TrackSubmissionSchema (strict regex format check)
    if (parsed.data.isrc) {
      const isrcCheck = TrackSubmissionSchema.pick({ isrc: true }).safeParse({ isrc: parsed.data.isrc })
      if (!isrcCheck.success) {
        return NextResponse.json(
          { error: 'Invalid ISRC format', details: isrcCheck.error.flatten() },
          { status: 400 }
        )
      }
    }

    // ISRC deduplication:
    const db = prisma as unknown as {
      track: {
        findUnique: (args: unknown) => Promise<{ id: string } | null>
        create: (args: unknown) => Promise<{ id: string; title: string; genre: string; isrc: string | null; spotifyTrackId: string | null; bandId: string }>
      }
    }
    if (parsed.data.isrc) {
      const existing = await db.track.findUnique({ where: { isrc: parsed.data.isrc } })
      if (existing) {
        return NextResponse.json({ error: 'Track with this ISRC already exists', existingTrackId: existing.id }, { status: 409 })
      }
    }
    const track = await db.track.create({ data: { ...parsed.data } })

    // After DB insert, trigger async enrichment (fire-and-forget):
    // void enrichTrack({ trackId: track.id, title: track.title, artistName: band.name, spotifyTrackId: track.spotifyTrackId })

    return NextResponse.json({ success: true, track, enrichmentQueued: Boolean(parsed.data.spotifyTrackId) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
