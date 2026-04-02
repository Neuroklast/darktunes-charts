/**
 * GET /api/labels/:id/roster/market-index
 *
 * Returns market index summaries for all bands in a label's roster.
 *
 * Access: LABEL role (own label) or ADMIN.
 * Each band's index is only included if the band has PRO or PRO_PLUS subscription.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import {
  computeMarketIndex,
  normalizeSignal,
  type MarketSignal,
} from '@/domain/market'
import { rateLimiter } from '@/infrastructure/rateLimiter'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

export const GET = withAuth(
  ['LABEL', 'ADMIN'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const { allowed } = rateLimiter.check(user.id, 'label-roster-index', RATE_LIMIT, RATE_WINDOW_MS)
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const labelId = pathParts[pathParts.indexOf('labels') + 1]

    if (!labelId) {
      return NextResponse.json({ error: 'Missing label ID' }, { status: 400 })
    }

    try {
      // Authorisation: label can only view their own roster
      if (user.role === 'LABEL' && user.id !== labelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Get all active mandates for this label
      const mandates = await (prisma as unknown as {
        labelBandMandate: {
          findMany: (args: {
            where: { labelId: string; status: string }
            select: { bandId: boolean }
          }) => Promise<Array<{ bandId: string }>>
        }
      }).labelBandMandate.findMany({
        where: { labelId, status: 'ACTIVE' },
        select: { bandId: true },
      })

      if (mandates.length === 0) {
        return NextResponse.json({ labelId, roster: [] })
      }

      const bandIds = mandates.map(m => m.bandId)
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Fetch bands info
      const bands = await (prisma as unknown as {
        band: {
          findMany: (args: {
            where: { id: { in: string[] } }
            select: { id: boolean; name: boolean; tier: boolean; subscriptionTier: boolean }
          }) => Promise<Array<{ id: string; name: string; tier: string; subscriptionTier: string }>>
        }
      }).band.findMany({
        where: { id: { in: bandIds } },
        select: { id: true, name: true, tier: true, subscriptionTier: true },
      })

      // Fetch signals for all bands
      const allSnapshots = await (prisma as unknown as {
        marketSignalSnapshot: {
          findMany: (args: {
            where: { bandId: { in: string[] }; collectedAt: { gte: Date } }
            orderBy: { collectedAt: string }
          }) => Promise<Array<{ bandId: string; source: string; payload: unknown; collectedAt: Date }>>
        }
      }).marketSignalSnapshot.findMany({
        where: { bandId: { in: bandIds }, collectedAt: { gte: since } },
        orderBy: { collectedAt: 'desc' },
      })

      // Group snapshots by bandId
      const snapshotsByBand = new Map<string, typeof allSnapshots>()
      for (const snapshot of allSnapshots) {
        const existing = snapshotsByBand.get(snapshot.bandId) ?? []
        existing.push(snapshot)
        snapshotsByBand.set(snapshot.bandId, existing)
      }

      // Build roster summary
      const roster = bands.map(band => {
        if (band.subscriptionTier === 'FREE') {
          return { bandId: band.id, name: band.name, tier: band.tier, indexUnavailable: true }
        }

        const snapshots = snapshotsByBand.get(band.id) ?? []
        const signals: MarketSignal[] = snapshots.map(s => {
          const payload = s.payload as { value?: number; label?: string }
          const source = s.source.toLowerCase() as MarketSignal['source']
          const rawValue = payload.value ?? 0
          return {
            source,
            value: rawValue,
            normalizedValue: normalizeSignal(source, rawValue),
            collectedAt: s.collectedAt.toISOString(),
          }
        })

        const index = computeMarketIndex(signals)
        return {
          bandId: band.id,
          name: band.name,
          tier: band.tier,
          subscriptionTier: band.subscriptionTier,
          index: { value: index.value, isLowConfidence: index.isLowConfidence },
        }
      })

      // Audit log
      await (prisma as unknown as {
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId: string; metadata: unknown } }) => Promise<unknown>
        }
      }).auditLog.create({
        data: {
          action: 'roster_market_index_viewed',
          entityType: 'market_index_access',
          entityId: labelId,
          userId: user.id,
          metadata: { bandCount: bands.length },
        },
      })

      return NextResponse.json({ labelId, roster })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
