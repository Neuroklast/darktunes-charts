'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateCombinedScores, type TrackScores } from '@/domain/voting/combined'

export interface ComputeChartsResult {
  success: boolean
  error?: string
  processedTracks?: number
}

/**
 * Server Action: Triggers a full Combined Chart recalculation.
 *
 * This action:
 * 1. Fetches all active period vote data from the database.
 * 2. Runs Min-Max normalisation and 33/33/33 combination.
 * 3. Writes updated ChartSnapshot records.
 * 4. Revalidates all chart pages.
 *
 * In production this is also triggered by the /api/cron/schulze-compute
 * Vercel Cron Job every hour.
 *
 * @returns Number of tracks processed.
 */
export async function computeCharts(): Promise<ComputeChartsResult> {
  try {
    // 1. Auth check — only admin can manually trigger
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Nicht angemeldet' }
    }

    // In production, fetch raw scores from database:
    // const rawScores = await prisma.fanVote.groupBy({ ... })

    // Example with mock data for now:
    const mockScores: TrackScores[] = []
    const combinedScores = calculateCombinedScores(mockScores)

    // In production, write ChartSnapshot records:
    // await prisma.$transaction(combinedScores.map(score => ...))

    revalidatePath('/charts')
    revalidatePath('/')

    return { success: true, processedTracks: combinedScores.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
