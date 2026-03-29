import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateTrialStatus } from '@/domain/payment/trialStatus'

const querySchema = z.object({
  bandId: z.string().uuid(),
})

/**
 * GET /api/stripe/trial?bandId=<uuid>
 * Returns the current trial status for a band.
 *
 * Only authenticated users may query trial information.
 * Trial status has ZERO effect on chart ranking scores (Spec §3.2).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bandId = request.nextUrl.searchParams.get('bandId') ?? ''
    const parsed = querySchema.safeParse({ bandId })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid bandId', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // In production with Prisma:
    // const band = await prisma.band.findUnique({
    //   where: { id: parsed.data.bandId },
    //   select: { trialStartDate: true },
    // })
    // const trialStartDate = band?.trialStartDate?.toISOString() ?? null

    // Stub: trial start date would come from the database.
    const trialStartDate: string | null = null

    const status = calculateTrialStatus(trialStartDate)

    return NextResponse.json({ bandId: parsed.data.bandId, trial: status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
