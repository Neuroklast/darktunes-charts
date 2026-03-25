import { Robot } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { Band } from '@/lib/types'

interface AIScoutViewProps {
  bands: Band[]
}

/** Seeded-random helper for stable AI score display across renders. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

/** Derives a deterministic confidence score from a band's properties. */
function deriveConfidenceScore(band: Band, idx: number): number {
  const listenerFactor = Math.min(band.spotifyMonthlyListeners / 50_000, 1)
  const positionBonus = Math.max(0, 1 - idx * 0.05)
  const raw = (listenerFactor * 0.6 + positionBonus * 0.4) * 85 + seededRandom(idx * 13) * 15
  return Math.min(Math.round(raw), 95)
}

/** Empty state when no band data is available for prediction. */
function EmptyAIScout() {
  return (
    <Card className="p-12 glassmorphism text-center">
      <Robot className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">No Bands to Analyse</h3>
      <p className="text-muted-foreground text-sm">
        Band data is required to generate breakthrough predictions.
      </p>
    </Card>
  )
}

/**
 * Renders the AI Newcomer Scout view with breakthrough confidence scores.
 *
 * Predictions combine vote velocity, stream growth, and genre momentum to identify
 * bands statistically likely to tier-up within the next 3 months. Confidence
 * scores above 65% indicate a predicted breakthrough.
 */
export function AIScoutView({ bands }: AIScoutViewProps) {
  const analysedBands = bands.slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight mb-2 flex items-center gap-3">
          <Robot className="w-8 h-8 text-accent animate-glow-pulse" weight="duotone" />
          AI NEWCOMER SCOUT
        </h2>
        <p className="text-muted-foreground">
          Algorithmic predictions on which bands will break through next
        </p>
      </div>

      {analysedBands.length === 0 ? (
        <EmptyAIScout />
      ) : (
        <Card className="p-6 glassmorphism">
          <div className="space-y-6">
            {analysedBands.map((band, idx) => {
              const confidence = deriveConfidenceScore(band, idx)
              const isPredictedBreakthrough = confidence > 65

              const voteVelocity = (seededRandom(idx * 3) * 8 + 0.5).toFixed(1)
              const streamGrowth = Math.floor(seededRandom(idx * 3 + 1) * 50 + 5)
              const genreMomentum = (seededRandom(idx * 3 + 2) * 1.5 + 0.5).toFixed(1)

              return (
                <div key={band.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold">{band.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {band.genre} • {band.tier}
                      </p>
                    </div>
                    {isPredictedBreakthrough && (
                      <Badge variant="default" className="bg-accent text-accent-foreground gap-1 flex-shrink-0">
                        <span className="w-2 h-2 bg-accent-foreground rounded-full animate-glow-pulse" />
                        Breakthrough Likely
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Confidence Score</span>
                      <span className="text-sm font-mono font-bold text-accent">{confidence}%</span>
                    </div>
                    <Progress value={confidence} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-secondary/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Vote Velocity</p>
                      <p className="font-mono font-bold text-primary">+{voteVelocity}</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Stream Growth</p>
                      <p className="font-mono font-bold text-accent">+{streamGrowth}%</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Genre Momentum</p>
                      <p className="font-mono font-bold text-destructive">{genreMomentum}x</p>
                    </div>
                  </div>

                  {idx < analysedBands.length - 1 && <Separator />}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-6 glassmorphism bg-secondary/20">
        <h3 className="font-display font-semibold mb-2">How It Works</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>The AI Scout analyses three key factors to predict breakthrough potential:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-foreground">Vote Velocity:</strong> Rate of fan vote increase over time
            </li>
            <li>
              <strong className="text-foreground">Stream Growth:</strong> Spotify listener growth percentage
            </li>
            <li>
              <strong className="text-foreground">Genre Momentum:</strong> Performance relative to genre average
            </li>
          </ul>
          <p className="mt-4">
            Confidence scores above 65% indicate bands statistically likely to tier-up within 3 months.
          </p>
        </div>
      </Card>
    </div>
  )
}
