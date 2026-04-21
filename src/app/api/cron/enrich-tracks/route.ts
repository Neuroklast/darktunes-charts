import { NextResponse } from 'next/server'
import { enrichTrack } from '@/infrastructure/pipeline/enrichmentPipeline'
import { prisma } from '@/lib/prisma'

type EnrichDb = {
  track: {
    findMany: (args: unknown) => Promise<Array<{
      id: string
      title: string
      spotifyTrackId: string | null
      band: { name: string; spotifyArtistId: string | null }
    }>>
  }
}

/**
 * POST /api/cron/enrich-tracks
 *
 * Vercel Cron Job that processes the enrichment queue.
 * Fetches up to 20 tracks that are missing cover art and enriches them.
 * Secured by CRON_SECRET to prevent unauthorized triggering.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = prisma as unknown as EnrichDb
  const pending = await db.track.findMany({
    where: { coverArtUrl: null } as unknown as never,
    include: { band: { select: { name: true, spotifyArtistId: true } } },
    take: 20,
  })

  let processed = 0
  for (const track of pending) {
    try {
      await enrichTrack({
        trackId: track.id,
        title: track.title,
        artistName: track.band.name,
        spotifyTrackId: track.spotifyTrackId ?? undefined,
        spotifyArtistId: track.band.spotifyArtistId ?? undefined,
      })
      processed++
    } catch {
      // Continue with next track on failure
    }
  }

  return NextResponse.json({ processed, total: pending.length })
}
