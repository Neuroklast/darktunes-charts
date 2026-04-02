import { type MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

type BandForSitemap = { slug: string | null; updatedAt: Date }
type CompilationForSitemap = { id: string; publishedAt: Date | null }

type PrismaClient = {
  band: { findMany: (args: unknown) => Promise<BandForSitemap[]> }
  compilation: { findMany: (args: unknown) => Promise<CompilationForSitemap[]> }
}

const db = prisma as unknown as PrismaClient

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darktunes.com'

/**
 * Dynamic sitemap for DarkTunes.
 * Includes static pages, all band profiles, and published compilations.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/charts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/compilations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/awards`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/imprint`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  let bandRoutes: MetadataRoute.Sitemap = []
  let compilationRoutes: MetadataRoute.Sitemap = []

  try {
    const [bands, compilations] = await Promise.all([
      db.band.findMany({
        where: { slug: { not: null } },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      db.compilation.findMany({
        where: { publishedAt: { not: null } },
        select: { id: true, publishedAt: true },
        take: 500,
      }),
    ])

    bandRoutes = bands
      .filter((b): b is BandForSitemap & { slug: string } => b.slug !== null)
      .map((band) => ({
        url: `${SITE_URL}/bands/${band.slug}`,
        lastModified: band.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))

    compilationRoutes = compilations.length > 0
      ? [{
          url: `${SITE_URL}/compilations`,
          lastModified: compilations[0].publishedAt ?? new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }]
      : []
  } catch {
    // Database may not be configured during build — return static routes only
  }

  return [...staticRoutes, ...bandRoutes, ...compilationRoutes]
}
