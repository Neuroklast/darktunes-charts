/**
 * GET /api/bands/:id/market-index
 *
 * Returns the Dark Market Index for a band.
 *
 * Access control:
 *   - Band owner (BAND role) can view their own band's index.
 *   - LABEL role with an active mandate for the band can view.
 *   - ADMIN role can view any band's index.
 *
 * Subscription gating:
 *   - FREE tier: 403 Forbidden (feature not available)
 *   - PRO tier: current index value + components
 *   - PRO_PLUS tier: full breakdown + benchmarks
 *
 * All accesses are written to AuditLog (ADR-018).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import {
  computeMarketIndex,
  computeBenchmarks,
  normalizeSignal,
  type MarketSignal,
} from '@/domain/market'
import { rateLimiter } from '@/infrastructure/rateLimiter'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

export const GET = withAuth(
  ['BAND', 'LABEL', 'ADMIN'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const { allowed } = rateLimiter.check(user.id, 'market-index', RATE_LIMIT, RATE_WINDOW_MS)
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    // Extract band ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const bandId = pathParts[pathParts.indexOf('bands') + 1]

    if (!bandId) {
      return NextResponse.json({ error: 'Missing band ID' }, { status: 400 })
    }

    try {
      // Authorisation: band owner, label with mandate, or admin
      if (user.role !== 'ADMIN') {
        const resolvedBand = await (prisma as unknown as {
          band: { findUnique: (args: { where: { id: string }; select: { ownerId: boolean; subscriptionTier: boolean } }) => Promise<{ ownerId: string; subscriptionTier: string } | null> }
        }).band.findUnique({
          where: { id: bandId },
          select: { ownerId: true, subscriptionTier: true },
        })

        if (!resolvedBand) {
          return NextResponse.json({ error: 'Band not found' }, { status: 404 })
        }

        if (user.role === 'BAND' && resolvedBand.ownerId !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (user.role === 'LABEL') {
          // Check mandate exists
          const mandate = await (prisma as unknown as {
            labelBandMandate: { findFirst: (args: { where: { labelId: string; bandId: string; status: string } }) => Promise<{ id: string } | null> }
          }).labelBandMandate.findFirst({
            where: { labelId: user.id, bandId, status: 'ACTIVE' },
          })
          if (!mandate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        }

        // Subscription gating
        if (resolvedBand.subscriptionTier === 'FREE') {
          return NextResponse.json(
            { error: 'Market Index requires PRO or PRO_PLUS subscription' },
            { status: 403 },
          )
        }
      }

      // Fetch latest market signals (last 30 days)
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const snapshots = await (prisma as unknown as {
        marketSignalSnapshot: {
          findMany: (args: {
            where: { bandId: string; collectedAt: { gte: Date } }
            orderBy: { collectedAt: string }
          }) => Promise<Array<{ source: string; payload: unknown; collectedAt: Date }>>
        }
      }).marketSignalSnapshot.findMany({
        where: { bandId, collectedAt: { gte: since } },
        orderBy: { collectedAt: 'desc' },
      })

      // Convert snapshots to MarketSignal format
      const signals: MarketSignal[] = snapshots.map(snapshot => {
        const payload = snapshot.payload as { value?: number; label?: string }
        const source = snapshot.source.toLowerCase() as MarketSignal['source']
        const rawValue = payload.value ?? 0
        return {
          source,
          value: rawValue,
          normalizedValue: normalizeSignal(source, rawValue),
          collectedAt: snapshot.collectedAt.toISOString(),
          label: payload.label,
        }
      })

      const marketIndex = computeMarketIndex(signals)

      // Fetch band tier for benchmarks
      const bandForBenchmarks = await (prisma as unknown as {
        band: {
          findUnique: (args: {
            where: { id: string }
            select: { tier: boolean; genres: boolean; subscriptionTier: boolean }
          }) => Promise<{ tier: string; genres: string[]; subscriptionTier: string } | null>
        }
      }).band.findUnique({
        where: { id: bandId },
        select: { tier: true, genres: true, subscriptionTier: true },
      })

      // Write audit log
      await (prisma as unknown as {
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId: string; metadata: unknown } }) => Promise<unknown>
        }
      }).auditLog.create({
        data: {
          action: 'market_index_viewed',
          entityType: 'market_index_access',
          entityId: bandId,
          userId: user.id,
          metadata: { indexValue: marketIndex.value, signalCount: signals.length },
        },
      })

      const response: Record<string, unknown> = {
        bandId,
        index: {
          value: marketIndex.value,
          isLowConfidence: marketIndex.isLowConfidence,
          computedAt: marketIndex.computedAt,
        },
      }

      // PRO_PLUS: include full breakdown + benchmarks
      if (bandForBenchmarks?.subscriptionTier === 'PRO_PLUS' || user.role === 'ADMIN') {
        response.index = marketIndex
        if (bandForBenchmarks) {
          response.benchmarks = computeBenchmarks(
            {
              bandId,
              genreTags: bandForBenchmarks.genres,
              tier: bandForBenchmarks.tier as Parameters<typeof computeBenchmarks>[0]['tier'],
            },
            marketIndex.value,
          )
        }
      }

      return NextResponse.json(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
