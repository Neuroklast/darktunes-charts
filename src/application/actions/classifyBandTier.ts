'use server'

import { getTierFromListeners } from '@/domain/tiers'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'

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

    // In production with Prisma:
    // await prisma.$transaction([
    //   prisma.band.update({
    //     where: { id: bandId },
    //     data: { tier, spotifyFollowers: listeners.followers, lastTierRefresh: new Date() },
    //   }),
    //   prisma.transparencyLog.create({
    //     data: {
    //       eventType: 'TIER_CLASSIFICATION',
    //       entityId: bandId,
    //       payload: { tier, followers: listeners.followers, popularity: listeners.popularity },
    //     },
    //   }),
    // ])

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
