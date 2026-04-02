/**
 * POST /api/bands/:id/web-radio/import
 *
 * Imports web radio tracking data (MI On Air compatible format) and stores
 * it as a MarketSignalSnapshot with source `WEB_RADIO`.
 *
 * This is an import-only endpoint — it does not crawl or scrape.
 * Rate limited to prevent abuse.
 *
 * Access: BAND (own band), LABEL (mandated band), ADMIN
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import { rateLimiter } from '@/infrastructure/rateLimiter'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

/** Max web radio import requests per band per hour. */
const WEB_RADIO_RATE_LIMIT = 10
const WEB_RADIO_RATE_WINDOW_MS = 60 * 60 * 1000

/** Zod schema for the MI On Air compatible import payload. */
const WebRadioImportSchema = z.object({
  /** Total number of air plays in the measurement period. */
  totalAirPlays: z.number().int().min(0).max(1_000_000),
  /** Estimated listeners reached (optional, from station metadata). */
  estimatedListeners: z.number().int().min(0).optional(),
  /** Station name or identifier. */
  station: z.string().max(200).optional(),
  /** ISO 8601 date range start. */
  periodStart: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  /** ISO 8601 date range end. */
  periodEnd: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
})

export const POST = withAuth(
  ['BAND', 'LABEL', 'ADMIN'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const { allowed } = rateLimiter.check(user.id, 'web-radio-import', WEB_RADIO_RATE_LIMIT, WEB_RADIO_RATE_WINDOW_MS)
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const bandId = pathParts[pathParts.indexOf('bands') + 1]

    if (!bandId) {
      return NextResponse.json({ error: 'Missing band ID' }, { status: 400 })
    }

    try {
      // Authorisation check
      if (user.role !== 'ADMIN') {
        const band = await (prisma as unknown as {
          band: {
            findUnique: (args: { where: { id: string }; select: { ownerId: boolean } }) => Promise<{ ownerId: string } | null>
          }
        }).band.findUnique({
          where: { id: bandId },
          select: { ownerId: true },
        })

        if (!band) {
          return NextResponse.json({ error: 'Band not found' }, { status: 404 })
        }

        if (user.role === 'BAND' && band.ownerId !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (user.role === 'LABEL') {
          const mandate = await (prisma as unknown as {
            labelBandMandate: {
              findFirst: (args: { where: { labelId: string; bandId: string; status: string } }) => Promise<{ id: string } | null>
            }
          }).labelBandMandate.findFirst({
            where: { labelId: user.id, bandId, status: 'ACTIVE' },
          })
          if (!mandate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        }
      }

      const body: unknown = await request.json()
      const parsed = WebRadioImportSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const { totalAirPlays, estimatedListeners, station, periodStart, periodEnd } = parsed.data

      // Store as MarketSignalSnapshot
      const snapshot = await (prisma as unknown as {
        marketSignalSnapshot: {
          create: (args: {
            data: {
              bandId: string
              source: string
              payload: unknown
            }
          }) => Promise<{ id: string; collectedAt: Date }>
        }
      }).marketSignalSnapshot.create({
        data: {
          bandId,
          source: 'WEB_RADIO',
          payload: {
            value: totalAirPlays,
            label: 'Web Radio Air Plays',
            estimatedListeners,
            station,
            periodStart,
            periodEnd,
            importedBy: user.id,
          },
        },
      })

      // Audit log
      await (prisma as unknown as {
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId: string; metadata: unknown } }) => Promise<unknown>
        }
      }).auditLog.create({
        data: {
          action: 'web_radio_import',
          entityType: 'market_signal_snapshot',
          entityId: snapshot.id,
          userId: user.id,
          metadata: { bandId, totalAirPlays, station },
        },
      })

      return NextResponse.json({
        success: true,
        snapshotId: snapshot.id,
        collectedAt: snapshot.collectedAt,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
