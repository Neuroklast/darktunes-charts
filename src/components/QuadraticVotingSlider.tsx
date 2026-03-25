import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { calculateQuadraticCost } from '@/lib/voting'
import { cn } from '@/lib/utils'

interface QuadraticVotingSliderProps {
  trackId: string
  trackTitle: string
  bandName: string
  maxVotes: number
  currentVotes: number
  availableCredits: number
  onVoteChange: (trackId: string, votes: number) => void
  disabled?: boolean
}

export function QuadraticVotingSlider({
  trackId,
  trackTitle,
  bandName,
  maxVotes,
  currentVotes,
  availableCredits,
  onVoteChange,
  disabled = false
}: QuadraticVotingSliderProps) {
  const [votes, setVotes] = useState(currentVotes)
  const [animate, setAnimate] = useState(false)

  const creditsForThisTrack = calculateQuadraticCost(votes)
  const creditsForOthers = calculateQuadraticCost(currentVotes)
  const wouldExceed = creditsForThisTrack - creditsForOthers > availableCredits

  useEffect(() => {
    setVotes(currentVotes)
  }, [currentVotes])

  const handleValueChange = (value: number[]) => {
    const newVotes = value[0]
    setVotes(newVotes)
    setAnimate(true)
    setTimeout(() => setAnimate(false), 180)
  }

  const handleValueCommit = (value: number[]) => {
    const newVotes = value[0]
    const cost = calculateQuadraticCost(newVotes)
    const currentCost = calculateQuadraticCost(currentVotes)
    
    if (cost - currentCost <= availableCredits) {
      onVoteChange(trackId, newVotes)
    } else {
      setVotes(currentVotes)
    }
  }

  const costDelta = creditsForThisTrack - creditsForOthers
  const fillPercentage = (creditsForThisTrack / 100) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{trackTitle}</p>
          <p className="text-xs text-muted-foreground truncate">{bandName}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className={cn(
            "text-right transition-all",
            animate && "animate-counter"
          )}>
            <p className="font-mono text-lg font-medium">
              {votes}
            </p>
            <p className={cn(
              "text-xs font-mono",
              wouldExceed && votes > currentVotes ? "text-destructive" : "text-muted-foreground"
            )}>
              {creditsForThisTrack}c
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Slider
          value={[votes]}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          max={maxVotes}
          step={1}
          disabled={disabled}
          className={cn(
            "relative",
            wouldExceed && votes > currentVotes && "opacity-70"
          )}
        />
        
        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              wouldExceed && votes > currentVotes
                ? "bg-destructive"
                : "bg-gradient-to-r from-primary via-primary to-accent"
            )}
            style={{ width: `${Math.min(fillPercentage, 100)}%` }}
          />
        </div>
      </div>

      {wouldExceed && votes > currentVotes && (
        <p className="text-xs text-destructive">
          Insufficient credits (need {costDelta} more)
        </p>
      )}
    </div>
  )
}
