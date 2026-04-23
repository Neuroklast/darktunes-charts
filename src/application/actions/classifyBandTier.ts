'use server'

import { getTierFromListeners } from '@/domain/tiers'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'
import { prisma } from '@/lib/prisma'

type ClassifyDb = {
  band: {
    update: (args: unknown) => Promise<unknown>
  }
  auditLog: {
    create: (args: unknown) => Promise<unknown>
  }
}

/** Maps domain Tier ('Micro', 'Emerging', …) to Prisma enum ('MICRO', 'EMERGING', …). */
function toPrismaEnum(tier: string): string {
  return tier.toUpperCase().replace(' ', '_')
}

export interface ClassifyBandTierResult {
  success: boolean
  bandId: string
  tier?: string
  listeners?: number
  error?: string
}

/**
 * Server Action: Classifies a band's competition tier from its Spotify listeners.
 *
 * Workflow:
 * 1. Fetch the band's Spotify Monthly Listener proxy via the spotifyAdapter.
 * 2. Derive the competition tier using getTierFromListeners().
 * 3. Persist the new tier to the database (Prisma).
 * 4. Log the classification event in the transparency audit trail.
 *
 * Called by the weekly tier-refresh cron job and can also be triggered manually
 * from the band's admin dashboard to force an immediate re-classification.
 *
 * @param bandId - Internal database ID of the band.
 * @param spotifyArtistId - The band's Spotify artist ID.
 * @returns Classification result with the assigned tier and listener count.
 */
export async function classifyBandTier(
  bandId: string,
  spotifyArtistId: string
): Promise<ClassifyBandTierResult> {
  try {
    if (!bandId || !spotifyArtistId) {
      return { success: false, bandId, error: 'bandId and spotifyArtistId are required' }
    }

    const listeners = await getMonthlyListeners(spotifyArtistId)
    // Use follower count as the monthly listener proxy (Spotify API limitation)
    const tier = getTierFromListeners(listeners.followers)

    const db = prisma as unknown as ClassifyDb

    await db.band.update({
      where: { id: bandId },
      data: {
        tier: toPrismaEnum(tier) as never,
        spotifyMonthlyListeners: listeners.followers,
        updatedAt: new Date(),
      },
    })

    // Fire-and-forget audit log
    db.auditLog.create({
      data: {
        action: 'TIER_CLASSIFICATION',
        entityType: 'Band',
        entityId: bandId,
        metadata: { tier, followers: listeners.followers, popularity: listeners.popularity },
      },
    }).catch(() => {})

    return {
      success: true,
      bandId,
      tier,
      listeners: listeners.followers,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, bandId, error: message }
  }
}
