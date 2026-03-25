import { Heart, Disc, UsersThree } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Band, Track } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChartsViewProps {
  bands: Band[]
  tracks: Track[]
}

/** Maps a Tier to a badge variant for visual hierarchy. */
function getTierBadgeVariant(tier: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (tier) {
    case 'Macro':         return 'destructive'
    case 'International': return 'destructive'
    case 'Established':   return 'default'
    case 'Emerging':      return 'secondary'
    default:              return 'outline'
  }
}

/** Seeded-random number generator so scores don't flicker on re-render. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

/** Empty state shown when no tracks are available in the charts. */
function EmptyCharts() {
  return (
    <Card className="p-12 glassmorphism text-center">
      <Disc className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">No Tracks Yet</h3>
      <p className="text-muted-foreground text-sm">
        Submit your band to a category to appear in the charts.
      </p>
    </Card>
  )
}

/**
 * Renders the main overall charts view combining all three voting pillars.
 *
 * Scores are deterministically seeded from the track index to prevent
 * flickering on re-render until real voting data is connected.
 */
export function ChartsView({ bands, tracks }: ChartsViewProps) {
  const topTracks = tracks.slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">OVERALL CHARTS</h2>
        <p className="text-muted-foreground">Top tracks combining all three voting pillars (Fan, DJ, Peer)</p>
      </div>

      {topTracks.length === 0 ? (
        <EmptyCharts />
      ) : (
        <div className="space-y-4">
          {topTracks.map((track, idx) => {
            const band = bands.find(b => b.id === track.bandId)
            if (!band) return null

            const fanVotes = Math.floor(seededRandom(idx * 3) * 50 + idx * 10)
            const djScore  = Math.floor(seededRandom(idx * 3 + 1) * 30 + idx * 5)
            const peerVotes = Math.floor(seededRandom(idx * 3 + 2) * 20 + idx * 3)

            return (
              <Card key={track.id} className="p-6 glassmorphism hover:bg-card/60 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-md bg-secondary flex items-center justify-center font-display font-bold text-xl',
                        idx < 3 && 'glow-primary bg-primary/20',
                      )}
                    >
                      {idx + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-display text-xl font-semibold">{track.title}</h3>
                        <p className="text-muted-foreground">{band.name}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge variant={getTierBadgeVariant(band.tier)}>{band.tier}</Badge>
                        <Badge variant="outline">{band.genre}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-secondary/50 rounded">
                        <Heart className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">Fan Votes</p>
                        <p className="font-mono font-bold">{fanVotes}</p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded">
                        <Disc className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-xs text-muted-foreground">DJ Score</p>
                        <p className="font-mono font-bold">{djScore}</p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded">
                        <UsersThree className="w-5 h-5 mx-auto mb-1 text-destructive" />
                        <p className="text-xs text-muted-foreground">Peer Votes</p>
                        <p className="font-mono font-bold">{peerVotes}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Monthly Listeners</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min((band.spotifyMonthlyListeners / 1_000_000) * 100, 100)}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm font-medium">
                          {band.spotifyMonthlyListeners.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
