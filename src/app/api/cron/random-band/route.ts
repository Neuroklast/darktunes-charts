import { NextResponse, type NextRequest } from 'next/server'
import { selectBandOfTheDay, todayUTCDateString } from '@/domain/spotlight/randomBand'
import { prisma } from '@/lib/prisma'

type SpotlightDb = {
  band: {
    findMany: (args: unknown) => Promise<Array<{ id: string; name: string; tier: string; genre: string }>>
  }
  spotlight: {
    create: (args: unknown) => Promise<{ id: string }>
  }
}

/**
 * Vercel Cron Job: /api/cron/random-band
 * Runs daily at 00:00 UTC.
 * Selects the Band of the Day (Tier 1/2 only) and stores it in the Spotlight table.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = todayUTCDateString()

    const db = prisma as unknown as SpotlightDb
    const bands = await db.band.findMany({
      where: { tier: { in: ['MICRO', 'EMERGING'] } } as unknown as never,
      select: { id: true, name: true, tier: true, genre: true },
    })

    const selected = selectBandOfTheDay(
      bands as Parameters<typeof selectBandOfTheDay>[0],
      today,
    )

    if (!selected) {
      return NextResponse.json({ message: 'No eligible bands found', date: today })
    }

    // Create spotlight entry; duplicate on same day is caught and ignored
    try {
      await db.spotlight.create({ data: { bandId: selected.id, date: new Date(today) } })
    } catch {
      // Already created for today — idempotent
    }

    return NextResponse.json({
      success: true,
      date: today,
      spotlightBand: selected,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
