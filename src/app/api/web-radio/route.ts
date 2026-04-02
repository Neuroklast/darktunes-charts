/**
 * POST /api/web-radio/import
 * Imports web-radio play data for bands (batch endpoint).
 * Access: ADMIN only.
 *
 * Accepts a JSON array of play events; each event is stored as a MarketSnapshot
 * with source=WEBRADIO. The endpoint is idempotent per (bandId, snapshotDate).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { WebRadioImportPayloadSchema } from '@/domain/market'

export const POST = withAuth(['ADMIN'], async (request: NextRequest) => {
  const body: unknown = await request.json()
  const parsed = WebRadioImportPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { entries } = parsed.data

  const prismaTyped = prisma as unknown as {
    marketSnapshot: {
      createMany: (args: unknown) => Promise<{ count: number }>
    }
  }

  const records = entries.map((entry) => ({
    bandId: entry.bandId,
    source: 'WEBRADIO' as const,
    value: entry.listenerCount,
    metadata: {
      stationName: entry.stationName,
      trackTitle: entry.trackTitle ?? null,
    },
    snapshotDate: new Date(entry.playedAt),
  }))

  const result = await prismaTyped.marketSnapshot.createMany({
    data: records,
    skipDuplicates: true,
  })

  return NextResponse.json({ imported: result.count }, { status: 201 })
})
