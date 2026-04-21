import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const createBandSchema = z.object({
  name: z.string().min(1).max(200),
  genre: z.enum(['GOTH', 'METAL', 'DARK_ELECTRO', 'POST_PUNK', 'INDUSTRIAL', 'DARKWAVE', 'EBM', 'SYMPHONIC_METAL', 'AGGROTECH', 'NEOFOLK']),
  spotifyArtistId: z.string().optional(),
  country: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
})

/**
 * GET /api/bands
 * Returns a list of all registered bands.
 */
export async function GET() {
  try {
    const db = prisma as unknown as {
      band: {
        findMany: (args: unknown) => Promise<Array<{
          id: string; name: string; slug: string | null; genre: string; tier: string;
          spotifyMonthlyListeners: number; country: string | null; bio: string | null;
          isVerified: boolean; tracks: Array<{ id: string; title: string }>
        }>>
      }
    }
    const bands = await db.band.findMany({
      include: { tracks: { select: { id: true, title: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ bands })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/bands
 * Creates a new band registration.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = createBandSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // In production: const band = await prisma.band.create({ data: { ...parsed.data, ownerId: user.id } })
    const db = prisma as unknown as {
      band: {
        create: (args: unknown) => Promise<{ id: string; name: string; genre: string; tier: string; spotifyMonthlyListeners: number; isVerified: boolean }>
      }
    }
    const band = await db.band.create({ data: { ...parsed.data, ownerId: user.id } })
    return NextResponse.json({ success: true, band })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
