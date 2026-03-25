import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  SpotifyLogo,
  ArrowSquareOut,
  Star,
  Users,
  MusicNote,
} from '@phosphor-icons/react'
import type { Band, Track } from '@/lib/types'
import { seededRandom } from '@/lib/utils'

interface ArtistSpotlightProps {
  bands: Band[]
  tracks: Track[]
}

/** Placeholder gradient covers per genre when no real artwork is available. */
const GENRE_GRADIENTS: Record<string, string> = {
  Goth: 'from-purple-900 via-gray-900 to-black',
  Metal: 'from-gray-900 via-red-950 to-black',
  'Dark Electro': 'from-cyan-950 via-gray-900 to-black',
}

/** Milliseconds in one calendar day — used for daily spotlight seed generation. */
const MS_PER_DAY = 86_400_000

/**
 * Randomly highlights one artist from the catalogue each session.
 *
 * The selection uses a daily seed so the spotlight changes once per day
 * without requiring a backend call. Cover art is sourced from the band's
 * `coverArtUrl` field (populated via iTunes/Odesli API) or falls back to a
 * genre-specific gradient.
 *
 * This component prepares the structure for the Spotify API integration:
 * the `spotifyArtistId` field on Band enables embedding Spotify's follow button
 * and monthly listener data once OAuth is wired up.
 */
export function ArtistSpotlight({ bands, tracks }: ArtistSpotlightProps) {
  const featured = useMemo<Band | null>(() => {
    if (bands.length === 0) return null
    // Daily seed: changes once per UTC day, consistent within a session
    const today = Math.floor(Date.now() / MS_PER_DAY)
    const idx = Math.floor(seededRandom(today) * bands.length)
    return bands[idx] ?? null
  }, [bands])

  const bandTracks = useMemo(
    () => (featured ? tracks.filter(t => t.bandId === featured.id) : []),
    [featured, tracks],
  )

  if (!featured) return null

  const gradient = GENRE_GRADIENTS[featured.genre] ?? 'from-gray-900 to-black'

  return (
    <section aria-label="Artist Spotlight">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-accent" weight="duotone" />
        <h3 className="text-sm font-display font-semibold uppercase tracking-widest text-muted-foreground">
          Artist Spotlight
        </h3>
        <span className="text-xs text-muted-foreground/60 ml-auto">täglich neu</span>
      </div>

      <Card className="overflow-hidden glassmorphism group hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
        {/* Cover Art / Hero */}
        <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-end p-5`}>
          {featured.coverArtUrl ? (
            <img
              src={featured.coverArtUrl}
              alt={`${featured.name} cover art`}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500"
              loading="lazy"
            />
          ) : (
            /* Animated placeholder pattern */
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_oklch(0.35_0.15_300)_0%,_transparent_70%)] animate-glow-pulse" />
            </div>
          )}

          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="relative z-10 flex items-end justify-between w-full">
            <div>
              <Badge variant="secondary" className="mb-2 text-xs font-mono">
                {featured.genre}
              </Badge>
              <h4 className="font-display font-bold text-2xl tracking-tight text-white">
                {featured.name}
              </h4>
            </div>
            <Badge
              variant="outline"
              className="border-white/30 text-white/80 bg-white/10 backdrop-blur-sm"
            >
              {featured.tier}
            </Badge>
          </div>
        </div>

        {/* Stats + CTA */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<Users className="w-4 h-4 text-primary" weight="duotone" />}
              label="Monthly Listeners"
              value={featured.spotifyMonthlyListeners.toLocaleString('de-DE')}
            />
            <Stat
              icon={<MusicNote className="w-4 h-4 text-accent" weight="duotone" />}
              label="Eingereichte Tracks"
              value={String(bandTracks.length)}
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            {featured.spotifyUrl ? (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 flex-1 group/btn"
                asChild
              >
                <a
                  href={featured.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SpotifyLogo className="w-4 h-4" weight="fill" />
                  Auf Spotify
                  <ArrowSquareOut
                    className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                    weight="bold"
                  />
                </a>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="flex-1 gap-1.5 opacity-50" disabled>
                <SpotifyLogo className="w-4 h-4" weight="fill" />
                Spotify API ausstehend
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Artwork & Streaming-Links werden automatisch via iTunes & Odesli API befüllt,
            sobald ein Track mit Spotify- oder Apple-Music-ID hinterlegt ist.
          </p>
        </div>
      </Card>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
}

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
      {icon}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-mono font-bold text-sm">{value}</p>
      </div>
    </div>
  )
}
