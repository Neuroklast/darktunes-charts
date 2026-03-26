import { NextResponse } from 'next/server'
import { enrichTrack } from '@/infrastructure/pipeline/enrichmentPipeline'

/**
 * POST /api/cron/enrich-tracks
 *
 * Vercel Cron Job that processes the enrichment queue.
 * Secured by CRON_SECRET to prevent unauthorized triggering.
 *
 * In production:
 *   const pending = await prisma.track.findMany({ where: { enrichmentStatus: 'PENDING' }, take: 20 })
 *   for (const track of pending) { await enrichTrack({ ... }) }
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Demo run with a placeholder track
  const result = await enrichTrack({
    trackId: 'demo-track-id',
    title: 'Demo Track',
    artistName: 'Demo Artist',
    spotifyTrackId: undefined,
    spotifyArtistId: undefined,
  })

  return NextResponse.json({ processed: 1, result })
}
