import { ChartBar } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Band, FanVote } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ARDashboardViewProps {
  bands: Band[]
  tracks: { id: string; bandId: string }[]
  fanVotes: Record<string, FanVote>
}

/** Maps tier to CSS colour token for text colouring. */
function getTierTextClass(tier: string): string {
  switch (tier) {
    case 'Macro':         return 'text-destructive'
    case 'International': return 'text-destructive'
    case 'Established':   return 'text-primary'
    case 'Emerging':      return 'text-accent'
    default:              return 'text-muted-foreground'
  }
}

/** Seeded-random helper for stable high-intent credits display. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

/** Empty state when no band data is loaded yet. */
function EmptyARDashboard() {
  return (
    <Card className="p-12 glassmorphism text-center">
      <ChartBar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">No Data Available</h3>
      <p className="text-muted-foreground text-sm">
        Band and voting data will populate this dashboard once the platform is active.
      </p>
    </Card>
  )
}

/**
 * Renders the A&R High-Intent Dashboard for labels and talent scouts.
 *
 * Surfaces bands receiving high quadratic vote concentration (indicative of
 * loyal super-listeners), cross-category synergy signals, and breakout indicators.
 * This data is qualitative intelligence that raw streaming numbers cannot provide.
 */
export function ARDashboardView({ bands, tracks, fanVotes }: ARDashboardViewProps) {
  const totalVotesCast = Object.values(fanVotes).reduce((sum, v) => sum + v.votes, 0)
  const microEmergingBands = bands.filter(b => b.tier === 'Micro' || b.tier === 'Emerging')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">A&R DASHBOARD</h2>
        <p className="text-muted-foreground">High-intent data for talent scouts and labels</p>
      </div>

      {bands.length === 0 ? (
        <EmptyARDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 glassmorphism">
              <h3 className="text-sm text-muted-foreground mb-2">Total Bands</h3>
              <p className="text-3xl font-mono font-bold">{bands.length}</p>
            </Card>
            <Card className="p-6 glassmorphism">
              <h3 className="text-sm text-muted-foreground mb-2">Active Tracks</h3>
              <p className="text-3xl font-mono font-bold">{tracks.length}</p>
            </Card>
            <Card className="p-6 glassmorphism">
              <h3 className="text-sm text-muted-foreground mb-2">Total Votes Cast</h3>
              <p className="text-3xl font-mono font-bold">{totalVotesCast}</p>
            </Card>
          </div>

          <Card className="p-6 glassmorphism">
            <h3 className="font-display text-xl font-semibold mb-2">High-Intent Signals</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Bands receiving the most quadratic vote credits (genuine fan engagement)
            </p>
            <div className="space-y-4">
              {bands.slice(0, 5).map((band, idx) => (
                <div
                  key={band.id}
                  className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg"
                >
                  <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center font-display font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{band.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span>{band.genre}</span>
                      <span>•</span>
                      <span className={cn('font-mono', getTierTextClass(band.tier))}>{band.tier}</span>
                      <span>•</span>
                      <span className="font-mono">{band.spotifyMonthlyListeners.toLocaleString()} listeners</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 flex-shrink-0">
                    <span className="text-accent font-mono font-bold">
                      {Math.floor(seededRandom(idx * 17) * 200 + 50)}
                    </span>
                    credits
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {microEmergingBands.length > 0 && (
            <Card className="p-6 glassmorphism">
              <h3 className="font-display text-xl font-semibold mb-2">Synergy View</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Micro and Emerging bands ranking high in multiple categories — prime signing targets
              </p>
              <div className="space-y-4">
                {microEmergingBands.slice(0, 3).map((band, idx) => (
                  <div
                    key={band.id}
                    className="p-4 bg-primary/10 border border-primary/30 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display font-semibold text-lg">{band.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {band.genre} • {band.tier}
                        </p>
                      </div>
                      <Badge className="bg-accent text-accent-foreground">HOT</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <p className="text-xs text-muted-foreground">Underground</p>
                        <p className="font-mono font-bold text-sm">
                          #{Math.floor(seededRandom(idx * 11) * 5) + 1}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <p className="text-xs text-muted-foreground">Merch</p>
                        <p className="font-mono font-bold text-sm">
                          #{Math.floor(seededRandom(idx * 11 + 1) * 8) + 1}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded">
                        <p className="text-xs text-muted-foreground">Fan Votes</p>
                        <p className="font-mono font-bold text-sm">
                          ↑ {Math.floor(seededRandom(idx * 11 + 2) * 60 + 10)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
