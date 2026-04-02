import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'

type ChartEntry = {
  id: string
  rank: number
  score: number
  publishedAt: Date
  categoryId: string
  release: {
    title: string
    band: { name: string; slug: string | null }
  }
}

type PrismaClient = {
  chartEntry: {
    findMany: (args: unknown) => Promise<ChartEntry[]>
  }
}

const db = prisma as unknown as PrismaClient

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darktunes.com'

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * GET /api/feed/charts
 *
 * RSS 2.0 feed for the latest chart publications across all categories.
 * Suitable for embedding in blog readers, podcasts, and automation tools.
 */
export async function GET(): Promise<NextResponse> {
  let entries: ChartEntry[] = []

  try {
    entries = await db.chartEntry.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rank: true,
        score: true,
        publishedAt: true,
        categoryId: true,
        release: {
          select: {
            title: true,
            band: { select: { name: true, slug: true } },
          },
        },
      },
    })
  } catch {
    // Database may not be configured in this environment — return empty feed
    entries = []
  }

  const categoryMap = Object.fromEntries(
    Object.entries(CATEGORY_DEFINITIONS).map(([id, meta]) => [id, meta.name]),
  )

  const items = entries.map((entry) => {
    const categoryName = categoryMap[entry.categoryId] ?? entry.categoryId
    const bandName = escapeXml(entry.release?.band?.name ?? 'Unknown Artist')
    const releaseTitle = escapeXml(entry.release?.title ?? 'Unknown Release')
    const slug = entry.release?.band?.slug
    // Use a stable, unique deep-link for each entry. If no slug is available,
    // link to the charts page with a hash anchor for the entry.
    const link = slug
      ? `${SITE_URL}/bands/${slug}`
      : `${SITE_URL}/charts#${entry.id}`
    const pubDate = new Date(entry.publishedAt).toUTCString()

    return `
    <item>
      <title>${bandName} — ${releaseTitle} (#${entry.rank} in ${escapeXml(categoryName)})</title>
      <link>${link}</link>
      <description>Rank #${entry.rank} in the ${escapeXml(categoryName)} charts with a score of ${entry.score.toFixed(1)}.</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">chart-entry-${entry.id}</guid>
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DarkTunes Charts</title>
    <link>${SITE_URL}/charts</link>
    <description>Latest chart positions from DarkTunes — the community-driven dark music charts.</description>
    <language>de</language>
    <atom:link href="${SITE_URL}/api/feed/charts" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
