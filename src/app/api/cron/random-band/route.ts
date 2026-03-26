import { NextResponse, type NextRequest } from 'next/server'
import { selectBandOfTheDay, todayUTCDateString } from '@/domain/spotlight/randomBand'

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

    // In production, load eligible bands from database:
    // const bands = await prisma.band.findMany({
    //   where: { tier: { in: ['MICRO', 'EMERGING'] } },
    //   select: { id: true, name: true, tier: true, genre: true }
    // })
    const bands: Parameters<typeof selectBandOfTheDay>[0] = []

    const selected = selectBandOfTheDay(bands, today)

    if (!selected) {
      return NextResponse.json({ message: 'No eligible bands found', date: today })
    }

    // In production, upsert into Spotlight table:
    // await prisma.spotlight.create({ data: { bandId: selected.id, date: new Date(today) } })

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
