import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Heart,
  Lightning,
  Star,
  FilmSlate,
  TShirt,
  ImageSquare,
  HandHeart,
  Flame,
} from '@phosphor-icons/react'
import type { Band, Track, FanVote } from '@/lib/types'
import { seededRandom } from '@/lib/utils'
import { CATEGORY_DEFINITIONS } from '@/lib/categories'
import type { AllCategory } from '@/lib/types'

interface SpecialAwardsProps {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
}

interface AwardDefinition {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  /** Picks the winner from the available data */
  pickWinner: (bands: Band[], tracks: Track[], fanVotes: Record<string, FanVote>) => AwardWinner | null
}

interface AwardWinner {
  name: string
  detail: string
  badgeLabel: string
}

const SPECIAL_AWARDS: AwardDefinition[] = [
  {
    id: 'best-cover-art',
    title: 'Best Cover Art',
    subtitle: 'Bestes Artwork / Packaging',
    icon: <ImageSquare className="w-5 h-5" weight="duotone" />,
    color: 'text-purple-400',
    pickWinner: (bands, tracks) => {
      const idx = Math.floor(seededRandom(1) * tracks.length)
      const track = tracks[idx]
      const band = track ? bands.find(b => b.id === track.bandId) : null
      if (!band) return null
      return { name: band.name, detail: track.title, badgeLabel: band.genre }
    },
  },
  {
    id: 'best-merch',
    title: 'Best Merch',
    subtitle: 'Bestes Merchandise-Design',
    icon: <TShirt className="w-5 h-5" weight="duotone" />,
    color: 'text-cyan-400',
    pickWinner: (bands, _tracks) => {
      const idx = Math.floor(seededRandom(2) * bands.length)
      const band = bands[idx]
      if (!band) return null
      return { name: band.name, detail: 'Merch-Kollektion', badgeLabel: band.tier }
    },
  },
  {
    id: 'best-music-video',
    title: 'Best Music Video',
    subtitle: 'Bestes Musikvideo / Visualizer',
    icon: <FilmSlate className="w-5 h-5" weight="duotone" />,
    color: 'text-pink-400',
    pickWinner: (bands, tracks) => {
      const idx = Math.floor(seededRandom(3) * tracks.length)
      const track = tracks[idx]
      const band = track ? bands.find(b => b.id === track.bandId) : null
      if (!band) return null
      return { name: track.title, detail: band.name, badgeLabel: band.genre }
    },
  },
  {
    id: 'dark-integrity',
    title: 'Dark Integrity Award',
    subtitle: 'Soziales Engagement in der Szene',
    icon: <HandHeart className="w-5 h-5" weight="duotone" />,
    color: 'text-green-400',
    pickWinner: (bands) => {
      const idx = Math.floor(seededRandom(4) * bands.length)
      const band = bands[idx]
      if (!band) return null
      return { name: band.name, detail: 'Anti-Mobbing & Mental Health', badgeLabel: 'Community' }
    },
  },
  {
    id: 'underground-anthem',
    title: 'Underground Anthem',
    subtitle: 'Bester Track < 10k Listeners',
    icon: <Flame className="w-5 h-5" weight="duotone" />,
    color: 'text-orange-400',
    pickWinner: (bands, tracks, fanVotes) => {
      const microBands = bands.filter(b => b.spotifyMonthlyListeners <= 10_000)
      if (microBands.length === 0) return null
      const microTracks = tracks.filter(t => microBands.some(b => b.id === t.bandId))
      if (microTracks.length === 0) return null
      const top = microTracks.sort((a, b) =>
        (fanVotes[b.id]?.creditsSpent ?? 0) - (fanVotes[a.id]?.creditsSpent ?? 0)
      )[0]
      const band = top ? bands.find(b => b.id === top.bandId) : null
      if (!top || !band) return null
      return { name: top.title, detail: band.name, badgeLabel: 'Micro' }
    },
  },
  {
    id: 'fan-favourite',
    title: 'Fan Favourite',
    subtitle: 'Meiste Voice Credits aller Fans',
    icon: <Heart className="w-5 h-5" weight="duotone" />,
    color: 'text-red-400',
    pickWinner: (bands, tracks, fanVotes) => {
      const sorted = [...tracks].sort(
        (a, b) => (fanVotes[b.id]?.creditsSpent ?? 0) - (fanVotes[a.id]?.creditsSpent ?? 0)
      )
      const top = sorted[0]
      const band = top ? bands.find(b => b.id === top.bandId) : null
      if (!top || !band) return null
      return {
        name: top.title,
        detail: `${fanVotes[top.id]?.creditsSpent ?? 0} Credits`,
        badgeLabel: band.name,
      }
    },
  },
  {
    id: 'rising-star',
    title: 'Rising Star',
    subtitle: 'Stärkster Momentum-Anstieg',
    icon: <Lightning className="w-5 h-5" weight="duotone" />,
    color: 'text-yellow-400',
    pickWinner: (bands) => {
      const emerging = bands.filter(b => b.tier === 'Emerging' || b.tier === 'Micro')
      if (emerging.length === 0) return null
      const idx = Math.floor(seededRandom(6) * emerging.length)
      const band = emerging[idx]
      if (!band) return null
      return { name: band.name, detail: `${band.spotifyMonthlyListeners.toLocaleString('de-DE')} Listener`, badgeLabel: band.genre }
    },
  },
  {
    id: 'scene-legend',
    title: 'Scene Legend',
    subtitle: 'Szene-Ikone des Monats',
    icon: <Star className="w-5 h-5" weight="duotone" />,
    color: 'text-amber-300',
    pickWinner: (bands) => {
      const legends = bands.filter(b => b.tier === 'International' || b.tier === 'Macro')
      if (legends.length === 0) return null
      const idx = Math.floor(seededRandom(7) * legends.length)
      const band = legends[idx]
      if (!band) return null
      return { name: band.name, detail: `${band.spotifyMonthlyListeners.toLocaleString('de-DE')} Listener`, badgeLabel: band.genre }
    },
  },
]

/**
 * Special Awards sidebar displayed alongside the genre charts.
 *
 * Awards are derived from real fan-vote data where possible; others use
 * deterministic daily seeds. This component maps directly to the category
 * definitions in categories.ts (Best Cover Art, Best Merch, Best Music Video)
 * and extends them with additional scene-culture awards.
 */
export function SpecialAwards({ bands, tracks, fanVotes }: SpecialAwardsProps) {
  const awards = useMemo(
    () =>
      SPECIAL_AWARDS.map(award => ({
        ...award,
        winner: award.pickWinner(bands, tracks, fanVotes),
      })).filter(a => a.winner !== null),
    [bands, tracks, fanVotes],
  )

  return (
    <section aria-label="Special Awards">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-accent" weight="duotone" />
        <h3 className="text-sm font-display font-semibold uppercase tracking-widest text-muted-foreground">
          Special Awards
        </h3>
      </div>

      <div className="space-y-2">
        {awards.map(({ id, title, subtitle, icon, color, winner }) => (
          <Card
            key={id}
            className="p-4 glassmorphism hover:bg-card/60 transition-all duration-300 group cursor-default"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${color} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="font-display font-semibold text-sm leading-tight">{title}</p>
                  {winner && (
                    <Badge variant="outline" className="text-[10px] shrink-0 py-0">
                      {winner.badgeLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{subtitle}</p>
                {winner && (
                  <>
                    <p className="text-sm font-medium truncate">{winner.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{winner.detail}</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

// Re-export category name helper so the Awards section stays in sync with categories.ts
export function getAwardNameForCategory(categoryId: AllCategory): string {
  return CATEGORY_DEFINITIONS[categoryId]?.name ?? categoryId
}
