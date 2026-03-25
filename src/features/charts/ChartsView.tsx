import { useMemo } from 'react'
import { Heart, Disc, UsersThree } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Band, Track, FanVote } from '@/lib/types'
import { cn, seededRandom } from '@/lib/utils'

interface ChartsViewProps {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
}

function getTierBadgeVariant(tier: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (tier) {
    case 'Macro':         return 'destructive'
    case 'International': return 'destructive'
    case 'Established':   return 'default'
    case 'Emerging':      return 'secondary'
    default:              return 'outline'
  }
}

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

interface ChartRow {
  track: Track
  band: Band
  fanCredits: number
  djScore: number
  peerScore: number
  compositeScore: number
}

/**
 * Renders the main overall charts view combining all three voting pillars.
 *
 * Fan credits are sourced from real KV vote data. DJ and peer scores are
 * deterministically seeded to prevent flicker until real pillar data is connected.
 */
export function ChartsView({ bands, tracks, fanVotes }: ChartsViewProps) {
  const chartRows = useMemo<ChartRow[]>(() => {
    return tracks
      .map((track, idx) => {
        const band = bands.find(b => b.id === track.bandId)
        if (!band) return null

        const fanCredits = fanVotes[track.id]?.creditsSpent ?? 0
        const djScore = Math.floor(seededRandom(idx * 3 + 1) * 30 + idx * 5)
        const peerScore = Math.floor(seededRandom(idx * 3 + 2) * 20 + idx * 3)
        const compositeScore = (fanCredits * 0.333) + (djScore * 0.333) + (peerScore * 0.333)

        return { track, band, fanCredits, djScore, peerScore, compositeScore }
      })
      .filter((row): row is ChartRow => row !== null)
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 10)
  }, [tracks, bands, fanVotes])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">OVERALL CHARTS</h2>
        <p className="text-muted-foreground">Top tracks combining all three voting pillars (Fan, DJ, Peer)</p>
      </div>

      {chartRows.length === 0 ? (
        <EmptyCharts />
      ) : (
        <div className="space-y-4">
          {chartRows.map(({ track, band, fanCredits, djScore, peerScore }, rank) => (
            <Card key={track.id} className="p-6 glassmorphism hover:bg-card/60 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-md bg-secondary flex items-center justify-center font-display font-bold text-xl',
                      rank < 3 && 'glow-primary bg-primary/20',
                    )}
                  >
                    {rank + 1}
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
                      <p className="text-xs text-muted-foreground">Fan Credits</p>
                      <p className="font-mono font-bold">{fanCredits}</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded">
                      <Disc className="w-5 h-5 mx-auto mb-1 text-accent" />
                      <p className="text-xs text-muted-foreground">DJ Score</p>
                      <p className="font-mono font-bold">{djScore}</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded">
                      <UsersThree className="w-5 h-5 mx-auto mb-1 text-destructive" />
                      <p className="text-xs text-muted-foreground">Peer Votes</p>
                      <p className="font-mono font-bold">{peerScore}</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
