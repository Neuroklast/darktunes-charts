import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Compilation = {
  id: string
  title: string
  publishedAt: Date | null
  description: string | null
  coverArtUrl: string | null
}

type PrismaClient = {
  compilation: {
    findMany: (args: unknown) => Promise<Compilation[]>
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
 * GET /api/feed/compilations
 *
 * RSS 2.0 feed for newly published DarkTunes compilations.
 * Suitable for embedding in blog readers and automation tools.
 */
export async function GET(): Promise<NextResponse> {
  let compilations: Compilation[] = []

  try {
    compilations = await db.compilation.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        description: true,
        coverArtUrl: true,
      },
    })
  } catch {
    // Database may not be configured in this environment — return empty feed
    compilations = []
  }

  const items = compilations.map((compilation) => {
    const title = escapeXml(compilation.title)
    const description = escapeXml(compilation.description ?? 'New DarkTunes compilation published.')
    const link = `${SITE_URL}/compilations`
    const pubDate = compilation.publishedAt
      ? new Date(compilation.publishedAt).toUTCString()
      : new Date().toUTCString()

    return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">compilation-${compilation.id}</guid>
    </item>`
  }).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DarkTunes Compilations</title>
    <link>${SITE_URL}/compilations</link>
    <description>New compilations from DarkTunes — curated dark music collections.</description>
    <language>de</language>
    <atom:link href="${SITE_URL}/api/feed/compilations" rel="self" type="application/rss+xml" />
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
