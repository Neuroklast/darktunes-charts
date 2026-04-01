import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { syncCompilationToSpotify, CompilationTrackSchema } from '@/infrastructure/spotify/playlistSync'
import { prisma } from '@/lib/prisma'

const requestSchema = z.object({
  spotifyUserId: z.string().min(1),
  spotifyAccessToken: z.string().min(1),
  existingPlaylistId: z.string().optional(),
})

type CompilationWithTracks = {
  id: string
  title: string
  tracks: Array<{
    release: {
      title: string
      band: { name: string }
      spotifyUri?: string | null
    }
    spotifyTrackUri?: string | null
  }>
}

type PrismaClient = {
  compilation: {
    findUnique: (args: unknown) => Promise<CompilationWithTracks | null>
    update: (args: unknown) => Promise<unknown>
  }
}

const db = prisma as unknown as PrismaClient

/**
 * POST /api/admin/compilations/:id/sync-spotify
 *
 * Syncs a DarkTunes compilation to a Spotify playlist.
 * Requires admin role and a valid Spotify user OAuth access token.
 *
 * Body: { spotifyUserId, spotifyAccessToken, existingPlaylistId? }
 * Returns: { success, spotifyPlaylistUrl }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: compilationId } = await params
    const body: unknown = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { spotifyUserId, spotifyAccessToken, existingPlaylistId } = parsed.data

    const compilation = await db.compilation.findUnique({
      where: { id: compilationId },
      select: {
        id: true,
        title: true,
        tracks: {
          select: {
            spotifyTrackUri: true,
            release: {
              select: {
                title: true,
                spotifyUri: true,
                band: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!compilation) {
      return NextResponse.json({ error: 'Compilation not found' }, { status: 404 })
    }

    // Build track list — prefer track-level Spotify URI, fall back to release URI
    const tracks = compilation.tracks
      .map((t) => {
        const uri = t.spotifyTrackUri ?? t.release?.spotifyUri
        if (!uri) return null
        const parsed = CompilationTrackSchema.safeParse({
          spotifyTrackUri: uri,
          title: t.release?.title ?? '',
          artist: t.release?.band?.name ?? '',
        })
        return parsed.success ? parsed.data : null
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No tracks with Spotify URIs found in this compilation' },
        { status: 422 },
      )
    }

    const spotifyPlaylistUrl = await syncCompilationToSpotify(
      compilation.id,
      compilation.title,
      tracks,
      spotifyUserId,
      spotifyAccessToken,
      existingPlaylistId,
    )

    // Persist the playlist URL back to the compilation record
    await db.compilation.update({
      where: { id: compilationId },
      data: { spotifyPlaylistUrl },
    })

    return NextResponse.json({ success: true, spotifyPlaylistUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
