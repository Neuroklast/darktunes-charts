/**
 * GET /api/bands/[id]/market-index
 * Returns the Dark Market Index for a band.
 * Access: band owner, label admin of the band's label, or ADMIN.
 * Subscription gated: band must have PRO or PRO_PLUS subscription tier.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { computeMarketIndex } from '@/domain/market'
import type { BandMarketSignals } from '@/domain/market'

/** Peer group max values used for normalisation (scene-specific estimates). */
const PEER_PEAK_VALUES = {
  spotify: 500_000,
  youtube: 1_000_000,
  webradio: 10_000,
  bandcamp: 100_000,
}

export const GET = withAuth(['BAND', 'LABEL', 'ADMIN'], async (request: NextRequest, user) => {
  const bandId = request.nextUrl.pathname.split('/')[3]

  if (!bandId) {
    return NextResponse.json({ error: 'Band ID missing' }, { status: 400 })
  }

  const prismaTyped = prisma as unknown as {
    band: {
      findUnique: (args: unknown) => Promise<{
        id: string
        ownerId: string
        labelId: string | null
        subscriptionTier: string
        spotifyMonthlyListeners: number
      } | null>
    }
    labelMember: {
      findMany: (args: unknown) => Promise<Array<{ labelId: string; userId: string; role: string }>>
    }
    marketSnapshot: {
      findMany: (args: unknown) => Promise<Array<{ source: string; value: number }>>
    }
  }

  const band = await prismaTyped.band.findUnique({ where: { id: bandId } })
  if (!band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 })
  }

  // Access control
  if (user.role !== 'ADMIN') {
    if (user.role === 'BAND' && band.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'LABEL') {
      if (!band.labelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const memberships = await prismaTyped.labelMember.findMany({
        where: { userId: user.id, labelId: band.labelId },
      })
      if (memberships.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // Subscription gate
  if (band.subscriptionTier === 'FREE' && user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Market Index requires PRO or PRO_PLUS subscription' },
      { status: 402 },
    )
  }

  // Fetch recent snapshots (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const snapshots = await prismaTyped.marketSnapshot.findMany({
    where: { bandId, snapshotDate: { gte: since } },
    orderBy: { snapshotDate: 'desc' } as unknown as never,
  })

  const signals: BandMarketSignals = {
    bandId,
    spotifyMonthlyListeners: band.spotifyMonthlyListeners,
    youtubeViewVelocity:
      snapshots.find((s) => s.source === 'YOUTUBE')?.value ?? null,
    webradioPlays:
      snapshots.find((s) => s.source === 'WEBRADIO')?.value ?? null,
    bandcampPresence:
      snapshots.find((s) => s.source === 'BANDCAMP')?.value ?? null,
  }

  const result = computeMarketIndex(signals, PEER_PEAK_VALUES)

  return NextResponse.json({ marketIndex: result })
})
