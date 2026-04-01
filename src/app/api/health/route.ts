import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const START_TIME = Date.now()

/**
 * GET /api/health
 *
 * Returns a health status object including DB connectivity, uptime, and version.
 * Used by uptime monitors (Vercel, Checkly, etc.) and load balancers.
 * Returns 200 when healthy, 503 when degraded.
 */
export async function GET(): Promise<NextResponse> {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; message?: string }> = {}

  // Check database connectivity
  const dbStart = Date.now()
  try {
    await (prisma as unknown as { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }).$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error) {
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      message: error instanceof Error ? error.message : 'Unknown DB error',
    }
  }

  const isHealthy = Object.values(checks).every((c) => c.status === 'ok')
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000)

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      uptime: uptimeSeconds,
      version: process.env.npm_package_version ?? 'unknown',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: isHealthy ? 200 : 503 },
  )
}
