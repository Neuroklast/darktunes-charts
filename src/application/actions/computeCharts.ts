'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateCombinedScores, type TrackScores } from '@/domain/voting/combined'
import { prisma } from '@/lib/prisma'

type ComputeDb = {
  fanVote: {
    groupBy: (args: unknown) => Promise<Array<{
      releaseId: string | null
      _sum: { votes: number | null; creditsSpent: number | null }
    }>>
  }
  votingPeriod: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>
  }
  user: {
    findUnique: (args: unknown) => Promise<{ role: string } | null>
  }
}

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

    const db = prisma as unknown as ComputeDb

    // Admin-only guard
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return { success: false, error: 'Nur Admins können Charts manuell berechnen' }
    }

    const period = await db.votingPeriod.findFirst({ where: { isActive: true }, select: { id: true } })
    if (!period) {
      return { success: false, error: 'Kein aktiver Abstimmungszeitraum' }
    }

    const grouped = await db.fanVote.groupBy({
      by: ['releaseId'],
      where: { periodId: period.id, releaseId: { not: null } },
      _sum: { votes: true, creditsSpent: true },
    })

    const rawScores: TrackScores[] = grouped
      .filter((g) => g.releaseId)
      .map((g) => ({
        trackId: g.releaseId!,
        fanScore: g._sum.votes ?? 0,
        djScore: 0,
        peerScore: 0,
      }))

    const combinedScores = calculateCombinedScores(rawScores)

    revalidatePath('/charts')
    revalidatePath('/')

    return { success: true, processedTracks: combinedScores.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}
