import { Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { QuadraticVotingSlider } from '@/components/QuadraticVotingSlider'
import type { Band, Track, FanVote } from '@/lib/types'
import { calculateQuadraticCost } from '@/lib/voting'

const TOTAL_CREDITS = 100

interface FanVoteViewProps {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
  onVoteChange: (trackId: string, votes: number) => void
  onSubmitVotes: () => void
}

/** Empty state shown when there are no tracks available to vote on. */
function EmptyVoteList() {
  return (
    <Card className="p-12 glassmorphism text-center">
      <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">No Tracks to Vote On</h3>
      <p className="text-muted-foreground text-sm">
        Tracks submitted by bands will appear here during active voting periods.
      </p>
    </Card>
  )
}

/**
 * Renders the fan quadratic voting interface.
 *
 * Each fan receives 100 voice credits per month. Casting N votes for a track costs N²
 * credits, incentivising fans to distribute credits across multiple artists rather
 * than concentrating all support on one popular act.
 */
export function FanVoteView({ bands, tracks, fanVotes, onVoteChange, onSubmitVotes }: FanVoteViewProps) {
  const usedCredits = Object.values(fanVotes).reduce(
    (sum, vote) => sum + calculateQuadraticCost(vote.votes),
    0,
  )
  const availableCredits = TOTAL_CREDITS - usedCredits
  const votedTrackCount = Object.keys(fanVotes).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight mb-2">FAN VOTING</h2>
          <p className="text-muted-foreground">
            Quadratic voting — your voice credits increase quadratically
          </p>
        </div>

        <Card className="p-4 glassmorphism min-w-[200px]">
          <p className="text-xs text-muted-foreground mb-2">Voice Credits</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-mono font-bold">{availableCredits}</span>
            <span className="text-muted-foreground">/ {TOTAL_CREDITS}</span>
          </div>
          <Progress value={usedCredits} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{usedCredits} credits spent</p>
        </Card>
      </div>

      {tracks.length === 0 ? (
        <EmptyVoteList />
      ) : (
        <div className="space-y-4">
          {tracks.map(track => {
            const band = bands.find(b => b.id === track.bandId)
            if (!band) return null

            return (
              <Card key={track.id} className="p-6 glassmorphism">
                <QuadraticVotingSlider
                  trackId={track.id}
                  trackTitle={track.title}
                  bandName={band.name}
                  maxVotes={10}
                  currentVotes={fanVotes[track.id]?.votes ?? 0}
                  availableCredits={availableCredits}
                  onVoteChange={onVoteChange}
                />
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-6 glassmorphism bg-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">Vote Summary</h3>
            <p className="text-sm text-muted-foreground">
              {votedTrackCount} {votedTrackCount === 1 ? 'track' : 'tracks'} selected
            </p>
          </div>
          <Button
            onClick={onSubmitVotes}
            disabled={usedCredits === 0 || usedCredits > TOTAL_CREDITS}
            className="gap-2"
            size="lg"
          >
            Submit Votes
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Tip: Vote costs increase quadratically</p>
          <p>• 1 vote = 1 credit | 2 votes = 4 credits | 3 votes = 9 credits</p>
          <p>• 5 votes = 25 credits | 10 votes = 100 credits</p>
        </div>
      </Card>
    </div>
  )
}
