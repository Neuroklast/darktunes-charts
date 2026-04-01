import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calculateGenreOverlap, type OtherBandData } from '@/domain/analytics/bandInsights'

type BandRow = { subscriptionTier: string; genres: string[] }

type OverlapDb = {
  band: { findUnique: (args: unknown) => Promise<BandRow | null> }
}

function getDb() {
  return prisma as unknown as OverlapDb
}

/**
 * GET /api/bands/[id]/analytics/overlap
 *
 * Returns genre overlap scores for the band. Pro+ only.
 * This endpoint uses placeholder overlap data as shared voter analysis
 * requires a dedicated data pipeline (to be implemented separately).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathSegments = new URL(request.url).pathname.split('/')
    const overlapIndex = pathSegments.indexOf('overlap')
    const bandId = pathSegments[overlapIndex - 2]

    const band = await getDb().band.findUnique({
      where: { id: bandId },
      select: { subscriptionTier: true, genres: true },
    })

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 })
    }

    if (band.subscriptionTier !== 'PRO_PLUS') {
      return NextResponse.json({ error: 'Pro+ subscription required' }, { status: 403 })
    }

    // Placeholder: genre overlap computation requires a cross-band voter analysis
    // pipeline. Returns empty overlap until that pipeline is available.
    const otherBandData: OtherBandData[] = []
    const overlap = calculateGenreOverlap(band.genres, otherBandData)

    return NextResponse.json({ overlap, isPending: otherBandData.length === 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
