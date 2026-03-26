import { NextResponse, type NextRequest } from 'next/server'
import { generateAIPrediction } from '@/domain/voting/prediction'
import type { Band } from '@/lib/types'

/**
 * GET /api/ai-prediction?bandId=xxx
 * Returns AI prediction data for a band.
 */
export async function GET(request: NextRequest) {
  try {
    const bandId = request.nextUrl.searchParams.get('bandId')

    if (!bandId) {
      return NextResponse.json({ error: 'bandId parameter required' }, { status: 400 })
    }

    // In production, load actual band data from database:
    // const band = await prisma.band.findUnique({ where: { id: bandId } })

    const mockBand: Band = {
      id: bandId,
      name: 'Unknown Band',
      genre: 'Goth',
      spotifyMonthlyListeners: 0,
      tier: 'Micro',
    }

    const prediction = generateAIPrediction(mockBand)

    return NextResponse.json({ prediction })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
