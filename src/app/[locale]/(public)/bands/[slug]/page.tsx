import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getTierBadgeVariant } from '@/lib/utils'
import { ArrowLeft, ExternalLink, Music2, BarChart3 } from 'lucide-react'

type BandWithReleases = {
  id: string
  name: string
  slug: string
  bio: string | null
  genres: string[]
  tier: string
  spotifyMonthlyListeners: number
  imageUrl: string | null
  coverArtUrl: string | null
  spotifyUrl: string | null
  bandcampUrl: string | null
  country: string | null
  formedYear: number | null
  subscriptionTier: string
  releases: Array<{
    id: string
    title: string
    releaseType: string
    releaseDate: Date | null
    coverArtUrl: string | null
    spotifyUri: string | null
  }>
}

type PrismaClient = {
  band: {
    findUnique: (args: unknown) => Promise<BandWithReleases | null>
  }
}

const db = prisma as unknown as PrismaClient

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  let name = slug

  try {
    const band = await db.band.findUnique({
      where: { slug },
      select: { name: true, bio: true },
    }) as { name: string; bio: string | null } | null
    if (band) name = band.name
  } catch {
    // DB not available during build
  }

  return {
    title: `${name} · DarkTunes`,
    description: `${name} — Band-Profil, Releases, Chart-History auf DarkTunes.`,
    openGraph: {
      title: `${name} · DarkTunes`,
      type: 'profile',
    },
  }
}

/**
 * Public band profile page (slug-based).
 *
 * Shows hero section, bio, releases, streaming links, and a link to analytics
 * (only visible to authenticated band owners).
 */
export default async function BandSlugPage({ params }: PageProps) {
  const { slug } = await params

  let band: BandWithReleases | null = null

  try {
    band = await db.band.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        genres: true,
        tier: true,
        spotifyMonthlyListeners: true,
        imageUrl: true,
        coverArtUrl: true,
        spotifyUrl: true,
        bandcampUrl: true,
        country: true,
        formedYear: true,
        subscriptionTier: true,
        releases: {
          orderBy: { releaseDate: 'desc' },
          take: 12,
          select: {
            id: true,
            title: true,
            releaseType: true,
            releaseDate: true,
            coverArtUrl: true,
            spotifyUri: true,
          },
        },
      },
    })
  } catch {
    // DB not available — show not found
  }

  if (!band) {
    notFound()
  }

  const tierVariant = getTierBadgeVariant(band.tier)

  return (
    <main className="min-h-screen gradient-mesh">

      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6">
        <Link
          href="/charts"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft size={12} />
          Zurück zu Charts
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-sm bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0">
            <Music2 size={32} className="text-white/20" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-3xl font-display text-white"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
              >
                {band.name}
              </h1>
              <Badge variant={tierVariant} className="text-[10px] uppercase tracking-wider shrink-0">
                {band.tier}
              </Badge>
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {band.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded-sm border border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#7C3AED]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-xs text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
              {band.country && <span>{band.country}</span>}
              {band.formedYear && <span>Gegründet {band.formedYear}</span>}
              <span>{band.spotifyMonthlyListeners.toLocaleString('de-DE')} monatliche Hörer</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2 shrink-0">
            {band.spotifyUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link href={band.spotifyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} className="mr-1.5 text-[#1DB954]" />
                  Spotify
                </Link>
              </Button>
            )}
            {band.bandcampUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link href={band.bandcampUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} className="mr-1.5 text-blue-400" />
                  Bandcamp
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/bands/${band.slug}/analytics`}>
                <BarChart3 size={12} className="mr-1.5" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>

        {/* Bio */}
        {band.bio && (
          <Card className="mt-6 p-5 bg-[#141414] border border-white/[0.06]">
            <p className="text-sm text-white/60 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              {band.bio}
            </p>
          </Card>
        )}

        {/* Releases */}
        {band.releases.length > 0 && (
          <section className="mt-8">
            <h2
              className="text-xs font-display text-white tracking-[0.14em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Releases
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {band.releases.map((release) => (
                <ReleaseCard key={release.id} release={release} />
              ))}
            </div>
          </section>
        )}

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MusicGroup',
              name: band.name,
              genre: band.genres,
              ...(band.spotifyUrl ? { url: band.spotifyUrl } : {}),
            }),
          }}
        />
      </div>
    </main>
  )
}

interface ReleaseCardProps {
  release: {
    id: string
    title: string
    releaseType: string
    releaseDate: Date | null
    coverArtUrl: string | null
    spotifyUri: string | null
  }
}

function ReleaseCard({ release }: ReleaseCardProps) {
  const year = release.releaseDate
    ? new Date(release.releaseDate).getFullYear()
    : null

  return (
    <div className="bg-[#141414] border border-white/[0.06] rounded-sm p-3">
      {/* Cover art placeholder */}
      <div className="w-full aspect-square bg-[#1a1a1a] rounded-sm mb-2 flex items-center justify-center">
        <Music2 size={20} className="text-white/15" />
      </div>
      <p
        className="text-xs font-display text-white truncate"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
      >
        {release.title}
      </p>
      <p className="text-[10px] text-white/30 mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
        {release.releaseType} {year && `· ${year}`}
      </p>
    </div>
  )
}
