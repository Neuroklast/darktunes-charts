import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SEED_BANDS, SEED_TRACKS } from '@/lib/seedData'
import { getCachedImageUrl } from '@/lib/imageCache'
import { getCountryFlag, getTierBadgeVariant, GENRE_GRADIENTS } from '@/lib/utils'
import type { Band, Track } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string; locale: string }>
}

export async function generateStaticParams() {
  return (SEED_BANDS as Band[]).map(band => ({ id: band.id }))
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const band = (SEED_BANDS as Band[]).find(b => b.id === id)
  if (!band) return { title: 'Band not found · DarkTunes' }
  return { title: `${band.name} · DarkTunes Charts` }
}

/**
 * Public band profile page showing metadata, tracks and chart standing.
 *
 * Uses seed data — real data will be connected once the Supabase band
 * management API is integrated. The page layout follows the "Liquid Obsidian"
 * design system: obsidian surface, glassmorphism cards, genre-specific gradients.
 */
export default async function BandProfilePage({ params }: PageProps) {
  const { id } = await params
  const band = (SEED_BANDS as Band[]).find(b => b.id === id)

  if (!band) notFound()

  const tracks = (SEED_TRACKS as Track[]).filter(t => t.bandId === band.id)
  const artworkSrc = band.coverArtUrl ?? band.logoUrl ?? null
  const gradient   = GENRE_GRADIENTS[band.genre] ?? 'from-gray-900 to-black'
  const flag       = band.country ? getCountryFlag(band.country) : ''

  return (
    <main className="min-h-screen gradient-mesh">

      {/* ── Hero ── */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {artworkSrc ? (
          <Image
            src={getCachedImageUrl(artworkSrc, { width: 1440, height: 320, fit: 'cover' }) ?? artworkSrc}
            alt={`${band.name} hero`}
            fill
            className="object-cover opacity-40"
            priority
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back link */}
        <div className="absolute top-4 left-4 md:left-8">
          <Link
            href="/charts"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
            aria-label="Zurück zu Charts"
          >
            <ArrowLeft size={13} />
            Charts
          </Link>
        </div>
      </div>

      {/* ── Profile Content ── */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 -mt-16 relative z-10 pb-16">

        {/* Band header card */}
        <Card className="glassmorphism p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">

            {/* Artwork thumbnail */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]">
              {artworkSrc ? (
                <Image
                  src={getCachedImageUrl(artworkSrc, { width: 128, height: 128, fit: 'cover' }) ?? artworkSrc}
                  alt={`${band.name} logo`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}
            </div>

            {/* Band info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={getTierBadgeVariant(band.tier)}>{band.tier}</Badge>
                <Badge variant="outline">{band.genre}</Badge>
                {flag && (
                  <span className="text-base" title={band.country}>
                    {flag}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">{band.name}</h1>
              {band.country && (
                <p className="text-sm text-muted-foreground mb-3">{band.country}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {band.spotifyMonthlyListeners.toLocaleString('de-DE')} monatliche Spotify-Hörer
              </p>

              {/* External links */}
              <div className="flex gap-3 mt-4">
                {band.spotifyUrl && (
                  <a
                    href={band.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-widest text-[#1DB954] hover:text-[#1DB954]/80 transition-colors border border-[#1DB954]/30 px-3 py-1.5 rounded-sm"
                  >
                    Spotify
                  </a>
                )}
                {band.bandcampUrl && (
                  <a
                    href={band.bandcampUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-widest text-[#1DA0C3] hover:text-[#1DA0C3]/80 transition-colors border border-[#1DA0C3]/30 px-3 py-1.5 rounded-sm"
                  >
                    Bandcamp
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tracks */}
        {tracks.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-display font-semibold text-white mb-3 uppercase tracking-wide">
              Tracks in den Charts
            </h2>
            <div className="space-y-2">
              {tracks.map(track => (
                <Card key={track.id} className="glassmorphism p-4 flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                    {track.coverArtUrl ? (
                      <Image
                        src={getCachedImageUrl(track.coverArtUrl, { width: 80, height: 80, fit: 'cover' }) ?? track.coverArtUrl}
                        alt={`${track.title} cover`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.category}</p>
                  </div>
                  {track.odesliUrl && (
                    <a
                      href={track.odesliUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      aria-label={`${track.title} überall anhören`}
                    >
                      Anhören →
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Chart history placeholder */}
        <Card className="glassmorphism p-6">
          <h2 className="text-lg font-display font-semibold text-white mb-2 uppercase tracking-wide">
            Chart-Verlauf
          </h2>
          <p className="text-sm text-muted-foreground">
            Chart-Verlauf wird nach dem ersten vollständigen Voting-Zeitraum angezeigt.
          </p>
        </Card>

      </div>
    </main>
  )
}
