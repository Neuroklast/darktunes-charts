/**
 * GET /api/labels/[id]/roster/market-index
 * Returns market index for all bands in the label's roster.
 * Access: LABEL admin of this label, or ADMIN.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { computeMarketIndex, type BandMarketSignals } from '@/domain/market'
import { isLabelAdmin } from '@/domain/labels'

const PEER_PEAK_VALUES = {
  spotify: 500_000,
  youtube: 1_000_000,
  webradio: 10_000,
  bandcamp: 100_000,
}

export const GET = withAuth(['LABEL', 'ADMIN'], async (request: NextRequest, user) => {
  const labelId = request.nextUrl.pathname.split('/')[3]

  if (!labelId) {
    return NextResponse.json({ error: 'Label ID missing' }, { status: 400 })
  }

  const prismaTyped = prisma as unknown as {
    labelMember: {
      findMany: (args: unknown) => Promise<Array<{ id: string; labelId: string; userId: string; role: string; createdAt: Date }>>
    }
    band: {
      findMany: (args: unknown) => Promise<Array<{
        id: string
        name: string
        ownerId: string
        labelId: string | null
        subscriptionTier: string
        spotifyMonthlyListeners: number
      }>>
    }
    marketSnapshot: {
      findMany: (args: unknown) => Promise<Array<{ bandId: string; source: string; value: number }>>
    }
  }

  if (user.role !== 'ADMIN') {
    const memberships = await prismaTyped.labelMember.findMany({
      where: { userId: user.id, labelId },
    })
    if (!isLabelAdmin(user.id, labelId, memberships.map((m) => ({ ...m, role: m.role as 'ADMIN' | 'MEMBER' })))) {
      return NextResponse.json({ error: 'Forbidden — label admin required' }, { status: 403 })
    }
  }

  const bands = await prismaTyped.band.findMany({ where: { labelId } })

  if (bands.length === 0) {
    return NextResponse.json({ roster: [] })
  }

  const bandIds = bands.map((b) => b.id)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const snapshots = await prismaTyped.marketSnapshot.findMany({
    where: { bandId: { in: bandIds }, snapshotDate: { gte: since } } as unknown as never,
    orderBy: { snapshotDate: 'desc' } as unknown as never,
  })

  const roster = bands.map((band) => {
    const bandSnapshots = snapshots.filter((s) => s.bandId === band.id)
    const signals: BandMarketSignals = {
      bandId: band.id,
      spotifyMonthlyListeners: band.spotifyMonthlyListeners,
      youtubeViewVelocity: bandSnapshots.find((s) => s.source === 'YOUTUBE')?.value ?? null,
      webradioPlays: bandSnapshots.find((s) => s.source === 'WEBRADIO')?.value ?? null,
      bandcampPresence: bandSnapshots.find((s) => s.source === 'BANDCAMP')?.value ?? null,
    }
    return {
      bandName: band.name,
      marketIndex: computeMarketIndex(signals, PEER_PEAK_VALUES),
    }
  })

  return NextResponse.json({ roster })
})
