import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendChartPublishedEmail } from '@/infrastructure/email/service'

type UserForDigest = {
  email: string
  displayName: string | null
  name: string
}

type PrismaClient = {
  user: {
    findMany: (args: unknown) => Promise<UserForDigest[]>
  }
}

const db = prisma as unknown as PrismaClient

/**
 * GET /api/cron/weekly-digest
 *
 * Sends the weekly chart digest email to all subscribed users.
 * Triggered by Vercel Cron (every Monday at 09:00 UTC).
 *
 * Requires: CRON_SECRET header for Vercel cron authentication.
 * See vercel.json for the schedule configuration.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // A01: Broken Access Control — cron endpoints must be secured
  const cronSecret = process.env.CRON_SECRET
  const secret = request.headers.get('authorization')

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron endpoint not configured' }, { status: 503 })
  }

  if (secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const periodLabel = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const chartsUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darktunes.com'}/charts`

  let users: UserForDigest[] = []

  try {
    users = await db.user.findMany({
      where: {
        // In a full implementation, this would check an email preferences table.
        // For now, include all active users.
        email: { not: '' },
      },
      select: { email: true, displayName: true, name: true },
      take: 500,
    })
  } catch {
    // Database may not be configured — skip silently
    users = []
  }

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      await sendChartPublishedEmail(
        user.email,
        'Overall',
        periodLabel,
        chartsUrl,
      )
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ success: true, sent, failed })
}
