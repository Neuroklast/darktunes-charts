import { useMemo } from 'react'
import { Robot } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { Band } from '@/lib/types'
import { generateAIPrediction } from '@/lib/voting'
import { seededRandom } from '@/lib/utils'

interface AIScoutViewProps {
  bands: Band[]
}

interface PredictionRow {
  band: Band
  confidenceScore: number
  predictedBreakthrough: boolean
  factors: {
    voteVelocity: number
    streamGrowth: number
    genreMomentum: number
  }
}

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
 * Uses generateAIPrediction with mock historical vote data derived from
 * each band's listener count and seeded velocity for reproducible demos.
 * Bands with confidence above 65% are flagged as likely breakthrough acts.
 */
export function AIScoutView({ bands }: AIScoutViewProps) {
  const predictions = useMemo<PredictionRow[]>(() => {
    const genreAvgGrowth = 12

    return bands
      .slice(0, 10)
      .map((band, idx) => {
        const now = Date.now()
        const velocity = seededRandom(idx * 7) * 8 + 0.5
        const historicalVotes = Array.from({ length: 10 }, (_, i) => ({
          timestamp: now - (10 - i) * 3 * 24 * 60 * 60 * 1000,
          votes: Math.floor(i * velocity + seededRandom(idx * 7 + i) * 5),
        }))
        const previousListeners = Math.max(1, Math.floor(band.spotifyMonthlyListeners * (1 - seededRandom(idx * 3 + 1) * 0.3)))

        const result = generateAIPrediction(
          band.id,
          historicalVotes,
          band.spotifyMonthlyListeners,
          previousListeners,
          genreAvgGrowth
        )

        return { band, ...result }
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
  }, [bands])

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

      {predictions.length === 0 ? (
        <EmptyAIScout />
      ) : (
        <Card className="p-6 glassmorphism">
          <div className="space-y-6">
            {predictions.map(({ band, confidenceScore, predictedBreakthrough, factors }, idx) => (
              <div key={band.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{band.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {band.genre} • {band.tier}
                    </p>
                  </div>
                  {predictedBreakthrough && (
                    <Badge variant="default" className="bg-accent text-accent-foreground gap-1 flex-shrink-0">
                      <span className="w-2 h-2 bg-accent-foreground rounded-full animate-glow-pulse" />
                      Breakthrough Likely
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Confidence Score</span>
                    <span className="text-sm font-mono font-bold text-accent">{confidenceScore}%</span>
                  </div>
                  <Progress value={confidenceScore} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-secondary/50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Vote Velocity</p>
                    <p className="font-mono font-bold text-primary">+{factors.voteVelocity}</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Stream Growth</p>
                    <p className="font-mono font-bold text-accent">+{factors.streamGrowth}%</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Genre Momentum</p>
                    <p className="font-mono font-bold text-destructive">{factors.genreMomentum}x</p>
                  </div>
                </div>

                {idx < predictions.length - 1 && <Separator />}
              </div>
            ))}
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
